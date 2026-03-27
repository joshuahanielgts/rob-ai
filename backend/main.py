import io
import json
import os
import threading
import wave
from pathlib import Path
from typing import Any

import ollama
import requests
import vosk
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()


def _clean_env(name: str, default: str) -> str:
    value = os.getenv(name, default).strip()
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1].strip()
    return value


ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _clean_env(
        "ALLOWED_ORIGINS",
        "http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

ESP_IP = _clean_env("ESP_IP", "http://192.168.1.50")
VOSK_MODEL = _clean_env("VOSK_MODEL", "vosk-model-small-en-us-0.15")
LLM = _clean_env("OLLAMA_MODEL", "llama3.1:8b")
API_TOKEN = _clean_env("ROB_AI_API_TOKEN", "")
MAX_AUDIO_BYTES = int(_clean_env("MAX_AUDIO_BYTES", "2500000"))
STATE_FILE = _clean_env("DEVICE_STATE_FILE", "device_state.json")

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, VOSK_MODEL)
STATE_PATH = Path(BASE_DIR) / STATE_FILE

DEVICE_IDS = {"light1", "light2"}
state_lock = threading.Lock()
model_lock = threading.Lock()
model: vosk.Model | None = None


def _load_state() -> dict[str, bool]:
    if not STATE_PATH.exists():
        return {"light1": False, "light2": False}

    try:
        payload = json.loads(STATE_PATH.read_text(encoding="utf-8"))
        return {
            "light1": bool(payload.get("light1", False)),
            "light2": bool(payload.get("light2", False)),
        }
    except Exception:
        return {"light1": False, "light2": False}


def _save_state(current_state: dict[str, bool]) -> None:
    STATE_PATH.write_text(json.dumps(current_state), encoding="utf-8")


device_state = _load_state()


def _get_model() -> vosk.Model:
    global model
    if model is None:
        with model_lock:
            if model is None:
                model = vosk.Model(MODEL_PATH)
    return model

class Intent(BaseModel):
    device: str
    action: str


class DeviceControlRequest(BaseModel):
    device_id: str
    state: bool


def _verify_api_token(x_api_token: str | None = Header(default=None)) -> None:
    if API_TOKEN and x_api_token != API_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid API token")


def _verify_websocket_token(websocket: WebSocket) -> bool:
    if not API_TOKEN:
        return True
    return websocket.headers.get("x-api-token") == API_TOKEN


def _call_esp(device: str, action: str) -> bool:
    try:
        response = requests.get(
            f"{ESP_IP}/api/control?device={device}&action={action}",
            timeout=1,
        )
        response.raise_for_status()
        return True
    except requests.RequestException:
        print("ESP not reachable")
        return False


def _apply_device_action(device: str, action: str) -> bool:
    if device not in DEVICE_IDS:
        raise HTTPException(status_code=400, detail=f"Unknown device '{device}'")
    if action not in {"on", "off"}:
        raise HTTPException(status_code=400, detail=f"Unknown action '{action}'")

    with state_lock:
        device_state[device] = action == "on"
        _save_state(device_state)
    return _call_esp(device, action)


def _transcribe_wav_bytes(audio_bytes: bytes) -> str:
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wav_reader:
            channels = wav_reader.getnchannels()
            sample_width = wav_reader.getsampwidth()
            sample_rate = wav_reader.getframerate()
            frames = wav_reader.readframes(wav_reader.getnframes())
    except wave.Error as err:
        raise HTTPException(status_code=400, detail="Invalid WAV payload") from err

    if channels != 1:
        raise HTTPException(status_code=400, detail="Audio must be mono WAV")
    if sample_width != 2:
        raise HTTPException(status_code=400, detail="Audio must be 16-bit WAV")

    recognizer = vosk.KaldiRecognizer(_get_model(), sample_rate)
    recognizer.AcceptWaveform(frames)
    result = json.loads(recognizer.FinalResult())
    return result.get("text", "").strip()


def _infer_intent(transcript: str) -> Intent | None:
    prompt = f'''
    User said: "{transcript}"
    Extract:
    - device: light1 or light2
    - action: on or off
    Respond ONLY in JSON.
    '''

    try:
        out = ollama.chat(
            model=LLM,
            messages=[{"role": "user", "content": prompt}],
            format="json",
            options={"temperature": 0},
        )
        parsed = json.loads(out["message"]["content"])
        device = str(parsed.get("device", "")).strip().lower()
        action = str(parsed.get("action", "")).strip().lower()
        if device in DEVICE_IDS and action in {"on", "off"}:
            return Intent(device=device, action=action)
    except Exception as e:
        print("LLM error:", e)

    lowered = transcript.lower()
    device = "light1" if "light 1" in lowered or "light one" in lowered else "light2" if "light 2" in lowered or "light two" in lowered else ""
    action = "on" if " on" in f" {lowered}" else "off" if " off" in f" {lowered}" else ""
    if device and action:
        return Intent(device=device, action=action)
    return None


def _check_ollama_health() -> dict[str, bool]:
    try:
        response = requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
        response.raise_for_status()
        payload = response.json()
        models = payload.get("models", [])
        model_names = {
            str(item.get("name", "")) for item in models if isinstance(item, dict)
        }
        return {
            "service_reachable": True,
            "model_available": any(name.startswith(LLM) for name in model_names),
        }
    except Exception:
        return {
            "service_reachable": False,
            "model_available": False,
        }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/health/dependencies")
def dependency_health() -> dict[str, bool]:
    ollama = _check_ollama_health()
    return {
        "vosk_model_exists": os.path.exists(MODEL_PATH),
        "ollama_service_reachable": ollama["service_reachable"],
        "ollama_model_available": ollama["model_available"],
    }


@app.get("/api/devices/status")
def get_device_status(_: None = Depends(_verify_api_token)) -> dict:
    with state_lock:
        return dict(device_state)


@app.post("/api/devices/control")
def control_device(payload: DeviceControlRequest, _: None = Depends(_verify_api_token)) -> dict[str, Any]:
    device_id = payload.device_id.strip().lower()
    action = "on" if payload.state else "off"
    esp_ok = _apply_device_action(device_id, action)
    return {
        "status": "success",
        "device": device_id,
        "action": action,
        "esp_reachable": esp_ok,
        "device_state": device_state,
    }


@app.post("/api/voice")
async def process_voice(audio: UploadFile = File(...), _: None = Depends(_verify_api_token)) -> dict[str, Any]:
    if not audio.filename.lower().endswith(".wav"):
        raise HTTPException(status_code=400, detail="Only WAV uploads are supported")

    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Audio file was empty")
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file too large")

    transcript = _transcribe_wav_bytes(data)
    if not transcript:
        return {
            "status": "no_speech",
            "transcript": "",
            "device_state": device_state,
            "intent": None,
        }

    intent = _infer_intent(transcript)
    esp_ok = None
    intent_payload = None
    if intent:
        esp_ok = _apply_device_action(intent.device, intent.action)
        intent_payload = intent.model_dump()

    return {
        "status": "success",
        "transcript": transcript,
        "intent": intent_payload,
        "esp_reachable": esp_ok,
        "device_state": device_state,
    }


@app.websocket("/ws/voice")
async def websocket_endpoint(websocket: WebSocket):
    if not _verify_websocket_token(websocket):
        await websocket.close(code=1008)
        return

    await websocket.accept()
    rec = vosk.KaldiRecognizer(_get_model(), 16000)

    try:
        while True:
            data = await websocket.receive_bytes()

            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                text = res.get("text", "")

                if text:
                    print(f"Heard: {text}")
                    intent = _infer_intent(text)
                    if intent:
                        _apply_device_action(intent.device, intent.action)

                    await websocket.send_json({
                        "status": "success",
                        "text": text,
                        "intent": intent.model_dump() if intent else None,
                    })

    except WebSocketDisconnect:
        print("Client disconnected")
