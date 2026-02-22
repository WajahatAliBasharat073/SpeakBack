# SpeakBack - AI Aphasia Therapy

SpeakBack is research-driven assistive application designed to help people with expressive aphasia practice speech through Gemini-powered live interactions.

## 🚀 One-Click Setup (Web)

### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
*Note: The app runs in **Demo Mode** by default. To enable AI speech, add your `GOOGLE_API_KEY` to `backend/.env`.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npx expo start --web
```

## ✨ Key Features
- **Live Gemini Therapy**: Interactive naming and gesture exercises.
- **Emergency AAC Bar**: Large, high-contrast buttons for urgent needs (Water, Bathroom, etc.).
- **Daily News Reader**: Simplified, one-sentence news summaries for functional reading.
- **Caregiver Dashboard**: Session logs, success metrics, and live transcription.
- **Multilingual Support**: English, Urdu, Spanish, and more.

## 👥 Sharing with Friends
Simply zip the folder and send it! They will need:
1. Python 3.10+ 
2. Node.js LTS
3. A modern web browser (Chrome/Edge recommended)
