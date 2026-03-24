import json
import requests
import vosk
import ollama
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ESP_IP = "http://192.168.1.50"
VOSK_MODEL = "vosk-model-small-en-us-0.15"
LLM = "llama3.1:8b"

BASE_DIR = os.path.dirname(__file__)
model = vosk.Model(os.path.join(BASE_DIR, VOSK_MODEL))

class Intent(BaseModel):
    device: str
    action: str

@app.websocket("/ws/voice")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    rec = vosk.KaldiRecognizer(model, 16000)

    try:
        while True:
            data = await websocket.receive_bytes()

            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                text = res.get("text", "")

                if text:
                    print(f"Heard: {text}")

                    prompt = f'''
                    User said: "{text}"
                    Extract:
                    - device: light1 or light2
                    - action: on or off
                    Respond ONLY in JSON.
                    '''

                    try:
                        out = ollama.chat(
                            model=LLM,
                            messages=[{'role': 'user', 'content': prompt}],
                            format="json",
                            options={'temperature': 0}
                        )

                        intent = json.loads(out['message']['content'])

                        try:
                            requests.get(
                                f"{ESP_IP}/api/control?device={intent['device']}&action={intent['action']}",
                                timeout=1
                            )
                        except:
                            print("ESP not reachable")

                        await websocket.send_json({
                            "status": "success",
                            "text": text,
                            "intent": intent
                        })

                    except Exception as e:
                        print("LLM error:", e)

    except WebSocketDisconnect:
        print("Client disconnected")
