# SpeakBack - Agent-Based AI Aphasia Therapy

SpeakBack is a **real-time, agentic assistive application** designed to help individuals with expressive aphasia. Built using the **Gemini Multimodal Live API**, it provides a low-latency, voice-to-voice, and vision-to-voice therapy experience.

## 🤖 Agent-Based Architecture

Unlike traditional chatbots, SpeakBack operates as a **multimodal agent**:

- **Real-Time Perception**: Continuously listens to audio and "sees" through the camera to provide contextual therapy.
- **Bilateral Interaction**: Uses Gemini's native audio generation for natural, back-and-forth conversation.
- **Clinical Guardrails**: Implements research-driven safety layers and cueing hierarchies (Phonemic, Semantic hints).
- **Proactive Support**: Detects therapeutic roadblocks and adjusts difficulty in real-time.

## ✨ Key Features

- **🎙️ Live Multimodal Sessions**: Real-time voice and video therapy sessions powered by the `gemini-2.5-flash-native-audio` model.
- **🚨 Needs Bar (AAC)**: High-contrast, interactive needs bar for instant communication of basic requirements.
- **📰 AI News Podcast Agent**: Automatically researches and summarizes the latest news into simplified, functional reading exercises.
- **📊 Caregiver Intelligence**: Real-time transcription and success metrics (naming accuracy, session intensity) stored in Firebase.
- **🌍 Multilingual Intelligence**: Native support for English, Urdu, and Spanish.

## 🚀 Setup & Installation

### 1. Backend (FastAPI Agent Server)

```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```

*Requires a `GOOGLE_API_KEY` in `backend/.env` for Live API features.*

### 2. Frontend (Expo Mobile App)

```bash
cd frontend
npm install
npx expo start
```

## 🛠️ Technology Stack

- **AI Engine**: Google Gemini Multimodal Live API (WebSockets)
- **Backend**: FastAPI, Uvicorn, Python SDK (`google-genai`)
- **Frontend**: React Native, Expo, Reanimated
- **Database**: Firebase (Auth & Firestore)
- **Audio/Video**: Expo-AV, Expo-Camera

---
*SpeakBack is an open-source project aimed at restoring the power of speech through advanced AI orchestration.*
