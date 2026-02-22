import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

def list_models():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in .env")
        return

    client = genai.Client(api_key=api_key)
    print("Listing relevant models and capabilities...")
    try:
        for model in client.models.list():
            if "gemini-2" in model.name or "flash" in model.name:
                print(f"Model ID: {model.name}")
                # Print all attributes to find where 'bidi' is mentioned
                m_vars = vars(model) if hasattr(model, '__dict__') else {}
                for k, v in m_vars.items():
                    if "method" in k.lower() or "bidi" in str(v).lower():
                        print(f"  {k}: {v}")
                print("-" * 20)
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_models()
