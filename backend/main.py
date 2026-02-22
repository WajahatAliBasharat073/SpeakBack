import os
import json
import asyncio
import logging
import random
import base64
import struct
from typing import Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini Configuration
# Using the "latest" alias for Native Audio as recommended in current ADK documentation
# This points to the most stable version for bidirectional audio interactions.
MODEL_ID = "gemini-2.5-flash-native-audio-latest"
API_KEY = os.getenv("GOOGLE_API_KEY")

def get_gemini_client():
    if not API_KEY:
        return None
    try:
        # Multimodal Live API (bidiGenerateContent) requires v1alpha in current preview
        return genai.Client(api_key=API_KEY, http_options={'api_version': 'v1alpha'})
    except Exception as e:
        logger.warning(f"Gemini client init failed: {e}")
        return None

def add_wav_header(pcm_data: bytes, sample_rate: int = 24000) -> bytes:
    """Wraps raw PCM data in a 44-byte WAV header."""
    header = struct.pack('<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        36 + len(pcm_data),
        b'WAVE',
        b'fmt ',
        16,
        1, # PCM
        1, # Mono
        sample_rate,
        sample_rate * 2,
        2,
        16,
        b'data',
        len(pcm_data)
    )
    return header + pcm_data

# Mock Tool for Guardrail Demonstration (Lesson 5/6 Pattern)
def mock_search_tool(query: str) -> str:
    """Simulates a search tool for guardrail testing."""
    return f"Search results for: {query}. (Protected Content)"

def domain_guardrail_callback(tool, args, tool_context):
    """Callback pattern from Lesson 5 to filter sensitive domains."""
    query = args.get("query", "").lower()
    blocked = ["social-media.com", "random-blog.com"]
    for domain in blocked:
        if domain in query:
            return {"error": "policy_violation", "reason": f"Content from {domain} is restricted."}
    return None

SYSTEM_PROMPT = """
You are SpeakBack, an AI speech-pathologist.
Target Patient: {name}
Language: {lang}
Interests: {interests}

Behavioral Guardrails (Lesson 5 Pattern):
- If user asks about medication, respond: "I can only help with speech practice. Please consult a doctor."
- Focus strictly on language therapy.

Cueing Hierarchy: 
1. [SHOW:item] -> "What is this?"
2. Semantic hint -> "It's used for..."
3. Phonemic hint -> "It starts with..."
"""

@app.get("/")
async def root():
    return {"status": "online", "mode": "Demo Mode" if not API_KEY else "Live Mode"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: str, session_id: str, name: str = "Patient", lang: str = "English", interests: str = "General"):
    await websocket.accept()
    logger.info(f"Session {session_id} started for {name}")
    
    client = get_gemini_client()
    
    if not client:
        logger.info("Entering Demo Mode (No API Key)")
        await run_mock_session(websocket, name, lang)
        return

    try:
        config = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT.format(name=name, lang=lang, interests=interests)}]
            },
            "response_modalities": ["AUDIO", "TEXT"]
        }
        
        async with client.aio.live.connect(model=MODEL_ID, config=config) as session:
            
            async def send_to_gemini():
                try:
                    while True:
                        if websocket.client_state.name == "DISCONNECTED":
                            break
                        data = await websocket.receive_json()
                        if data.get("type") == "realtime_input":
                            if data.get("mime_type"):
                                await session.send(types.LiveClientRealtimeInput(
                                    media_chunks=[types.Blob(data=data["data"], mime_type=data["mime_type"])]
                                ))
                            else:
                                await session.send(types.LiveClientRealtimeInput(
                                    media_chunks=[types.Blob(data=data["data"], mime_type="audio/wav")]
                                ))
                        elif data.get("type") == "emergency_need":
                            await session.send(f"USER EMERGENCY: {data['data']}", end_of_turn=True)
                except Exception as e:
                    logger.error(f"Send loop error: {e}")

            async def receive_from_gemini():
                try:
                    async for message in session.receive():
                        if websocket.client_state.name == "DISCONNECTED":
                            break
                        
                        if message.server_content and message.server_content.model_turn:
                            parts = message.server_content.model_turn.parts
                            for part in parts:
                                if part.inline_data:
                                    pcm_bytes = part.inline_data.data 
                                    logger.info(f"Received PCM chunk: {len(pcm_bytes)} bytes")
                                    wav_bytes = add_wav_header(pcm_bytes)
                                    wav_b64 = base64.b64encode(wav_bytes).decode('utf-8')
                                    await websocket.send_json({"type": "audio", "data": wav_b64})
                                if part.text:
                                    logger.info(f"Received Text: {part.text}")
                                    await websocket.send_json({"type": "text", "text": part.text})
                except Exception as e:
                    logger.error(f"Receive loop error: {e}")

            await asyncio.gather(send_to_gemini(), receive_from_gemini())

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Gemini Live error: {error_msg}")
        
        # Check for quota error specifically
        is_quota_error = "1011" in error_msg or "quota" in error_msg.lower()
        
        if websocket.client_state.name != "DISCONNECTED":
            if is_quota_error:
                await websocket.send_json({
                    "text": "⚠️ Gemini API Quota Exceeded. Switching to Demo Mode. Please check your billing/tier at Google AI Studio.",
                    "type": "error"
                })
            await run_mock_session(websocket, name, lang)

async def run_mock_session(websocket: WebSocket, name: str, lang: str):
    """Robust mock session for end-to-end testing."""
    if websocket.client_state.name == "DISCONNECTED":
        return

    welcome_text = {
        "English": f"Hello {name}! Let's practice speaking today. (Demo Mode - No Voice)",
        "Urdu": f"Assalam-o-Alaikum {name}! Aaj hum bolnay ki practice karengay. (Demo Mode)",
        "Spanish": f"¡Hola {name}! Vamos a practicar hablar hoy. (Modo Demo)"
    }.get(lang, f"Hello {name}! Let's practice.")

    try:
        await websocket.send_json({"text": welcome_text})
        await asyncio.sleep(2)
    except:
        return
    
    # Task flow simulation
    tasks = ["apple", "car", "dog", "phone", "book"]
    
    async def task_loop():
        for task in tasks:
            if websocket.client_state.name == "DISCONNECTED":
                break
            try:
                await websocket.send_json({"type": "show_task", "data": task})
                await websocket.send_json({"text": f"What is this? It's a {task}."})
                await asyncio.sleep(10) # Give user time to see it
            except:
                break

    # Handle incoming messages while tasks are running
    async def handle_incoming():
        while True:
            try:
                data = await websocket.receive_json()
                if data.get("type") == "emergency_need":
                    need = data["data"]
                    await websocket.send_json({"text": f"MOCK: I see you need {need}. I'm alerting your caregiver."})
                elif data.get("type") == "manual_end_turn":
                    await websocket.send_json({"text": "I heard something! Good try!"})
            except:
                break

    await asyncio.gather(task_loop(), handle_incoming())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
