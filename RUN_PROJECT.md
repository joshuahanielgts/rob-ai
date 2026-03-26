# ROB-AI Full Run Instructions (Frontend + Backend + Ollama)

This guide shows exactly how to run the whole project on Windows and includes real command outputs you should see.

## 1. Prerequisites

Install these first:

- Node.js 18+
- Python 3.10+
- Ollama

Check versions:

```powershell
node -v
npm -v
python --version
ollama --version
```

## 2. Project Setup

From project root:

```powershell
cd D:\Projects\rob-ai
npm install
```

Install backend Python dependencies:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

## 3. Environment Variables

Create root `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TOKEN=
```

Optional backend env vars (set in terminal before running backend):

```powershell
$env:ALLOWED_ORIGINS="http://localhost:8080,http://127.0.0.1:8080"
$env:ROB_AI_API_TOKEN=""
$env:ESP_IP="http://192.168.1.50"
$env:OLLAMA_MODEL="llama3.1:8b"
$env:VOSK_MODEL="vosk-model-small-en-us-0.15"
$env:MAX_AUDIO_BYTES="2500000"
```

## 4. Start Ollama

Open Terminal A:

```powershell
ollama serve
```

Open Terminal B:

```powershell
ollama pull llama3.1:8b
```

Expected output includes lines similar to:

```text
pulling manifest
pulling ...
verifying sha256 digest
success
```

## 5. Start Backend (FastAPI)

Open Terminal C:

```powershell
cd D:\Projects\rob-ai\backend
.venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output:

```text
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process ...
INFO:     Started server process ...
INFO:     Application startup complete.
```

## 6. Start Frontend (Vite)

Open Terminal D:

```powershell
cd D:\Projects\rob-ai
npm run dev
```

Expected output (example):

```text
VITE v5.x.x  ready in ... ms
Local:   http://localhost:8080/
Network: http://<your-ip>:8080/
```

## 7. Verify Backend Health

In a new terminal:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Expected output:

```text
status
------
ok
```

## 8. Verify Build, Lint, and Tests

From project root:

```powershell
cd D:\Projects\rob-ai
npm run lint
npm run build
npm run test
python -m pytest backend/tests -q
```

Verified output from this project run:

```text
npm run lint
-> Passed (no reported errors)

npm run build
-> Passed (Vite build completed successfully)

npm run test
-> Passed (1 passed test file, 3 passed tests)

python -m pytest backend/tests -q
-> Passed (6 passed)
```

## 9. Use the App

1. Open http://localhost:8080.
2. Hold the mic button to speak (or use keyboard: Enter/Space while focused).
3. Watch activity log and device toggles update.

## 10. Troubleshooting

### Backend unreachable from frontend

- Check backend is running on port 8000.
- Confirm `VITE_API_BASE_URL` is `http://localhost:8000`.

### `/api/health` returns `{"detail":"Not Found"}`

This usually means a different app is running on port 8000.

Check listeners on 8000:

```powershell
Get-NetTCPConnection -LocalPort 8000 -State Listen |
	Select-Object LocalAddress, LocalPort, OwningProcess
```

Show process details:

```powershell
$pids = Get-NetTCPConnection -LocalPort 8000 -State Listen |
	Select-Object -ExpandProperty OwningProcess -Unique
foreach ($id in $pids) {
	Get-CimInstance Win32_Process -Filter "ProcessId = $id" |
		Select-Object ProcessId, Name, CommandLine
}
```

Stop conflicting listeners:

```powershell
$pids = Get-NetTCPConnection -LocalPort 8000 -State Listen |
	Select-Object -ExpandProperty OwningProcess -Unique
foreach ($id in $pids) { Stop-Process -Id $id -Force }
```

Then start ROB-AI backend again from `backend`:

```powershell
cd D:\Projects\rob-ai\backend
.venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verify:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

Expected:

```text
status
------
ok
```

### 401 Unauthorized

- If `ROB_AI_API_TOKEN` is set, make sure `VITE_API_TOKEN` matches exactly.

### No transcription

- Confirm microphone permission is granted in browser.
- Confirm Vosk model exists at `backend/vosk-model-small-en-us-0.15`.
- Confirm audio is WAV mono 16-bit (the app records in compatible format).

### No intent/device action

- Confirm Ollama is running.
- Confirm model is available: `ollama list` should include `llama3.1:8b`.

### ESP relay not toggling hardware

- Confirm `ESP_IP` points to your device.
- API and UI still work even if ESP is offline.

## 11. Stop Everything

- Frontend: Ctrl+C in Terminal D
- Backend: Ctrl+C in Terminal C
- Ollama serve: Ctrl+C in Terminal A
