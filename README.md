# AI Short Video Reverse Engineer

A production-grade AI tool that converts short-form reference videos (1–90 seconds) into detailed **cinematography, character, style, audio, and recreation blueprints**.

## Architecture & Features

- **Phase 1: Project Foundation**: FastAPI backend + Next.js App Router (TypeScript + Tailwind CSS), multi-mode selection (Fast, Detailed, Deep), multi-provider selection (Gemini, OpenAI, Claude), and SQLite persistence.
- **Phase 2: Local Video Processing Engine**:
  - Technical metadata extraction using **FFprobe** (Duration, Resolution, Aspect Ratio, FPS, Codecs, File size) - strictly detected facts.
  - Scene/shot detection using **PySceneDetect** with OpenCV histogram fallback.
  - Smart keyframe extraction (Start, Middle, End + motion frames) with perceptual hash (`pHash`) deduplication.
  - Visual shot timeline with keyframe gallery.
- **Phase 3: Audio Engine**:
  - Audio extraction via **FFmpeg**.
  - Local speech-to-text transcription with timestamps using **faster-whisper**.
  - Acoustic transient SFX detection and music presence/tempo/mood analysis.
  - Audio preview player and dialogue timeline.

## Quickstart

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python run_backend.py
```
Backend runs on `http://127.0.0.1:8000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000`.
