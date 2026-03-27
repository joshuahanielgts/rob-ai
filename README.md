# ROB-AI Voice Home Controller

React + Vite frontend with a FastAPI backend for:

- Voice command capture from browser microphone
- Speech-to-text using Vosk
- Intent extraction using Ollama
- Device control for `light1` and `light2`
- Optional ESP relay call to physical hardware

## Architecture

- Frontend: `src/` (React, TypeScript, Tailwind, shadcn/ui)
- Backend: `backend/main.py` (FastAPI)
- Speech model: `backend/vosk-model-small-en-us-0.15/`

Frontend sends WAV audio to backend endpoint `POST /api/voice`.
Backend transcribes audio, infers intent, updates device state, and returns the latest state.

## Requirements

- Node.js 18+
- Python 3.10+
- Ollama installed and running locally
- Ollama model pulled: `llama3.1:8b`

## Quick Start

### 1) Frontend setup

```bash
npm install
```

Create `.env` in project root if needed:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TOKEN=
```

Run frontend:

```bash
npm run dev
```

Default frontend dev URL is usually `http://localhost:8080` (see `vite.config.ts`).

### 2) Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Start backend:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Optional backend env vars:

```bash
# Restrict browser origins allowed by CORS
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# Set if you want authenticated API calls
ROB_AI_API_TOKEN=

# Runtime wiring
ESP_IP=http://192.168.1.50
OLLAMA_MODEL=llama3.1:8b
VOSK_MODEL=vosk-model-small-en-us-0.15

# Upload safety guard (bytes)
MAX_AUDIO_BYTES=2500000
```

### 3) Ollama setup

```bash
ollama serve
ollama pull llama3.1:8b
```

## API Endpoints

- `GET /api/health`
	- Returns service health.

- `GET /api/health/dependencies`
	- Returns integration health for Vosk and Ollama model runtime.

- `GET /api/devices/status`
	- Returns current in-memory device state:
	- `{ "light1": boolean, "light2": boolean }`
	- Requires `X-API-Token` when `ROB_AI_API_TOKEN` is configured.

- `POST /api/devices/control`
	- Body:
	- `{ "device_id": "light1" | "light2", "state": boolean }`
	- Applies action and returns updated state.
	- Requires `X-API-Token` when `ROB_AI_API_TOKEN` is configured.

- `POST /api/voice`
	- `multipart/form-data` with `audio` WAV file
	- Returns transcript, inferred intent, and updated device state.
	- Requires `X-API-Token` when `ROB_AI_API_TOKEN` is configured.

- `WS /ws/voice`
	- Legacy streaming path (still available).

## Integration Notes

- Frontend recorder now exports mono 16-bit WAV at 16 kHz for Vosk compatibility.
- Backend currently accepts WAV uploads for `/api/voice`.
- Device state is persisted to `backend/device_state.json` and mirrored to UI after voice or manual toggle actions.
- ESP relay target defaults to `http://192.168.1.50` in `backend/main.py`.

## Development Scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
```

Backend tests:

```bash
cd backend
pytest -q
```

## Troubleshooting

- `Failed to send audio — backend unreachable`
	- Ensure backend is running on port 8000.
	- Ensure `VITE_API_BASE_URL` matches backend URL.

- No transcript / no action
	- Verify microphone permission is granted.
	- Confirm audio contains speech and not silence.
	- Confirm Vosk model exists at `backend/vosk-model-small-en-us-0.15`.

- Intent extraction issues
	- Ensure Ollama is running and `llama3.1:8b` is available.

- ESP hardware not toggling
	- Update `ESP_IP` in `backend/main.py` to your device address.
	- API still works even if ESP is unreachable; UI state remains consistent.
