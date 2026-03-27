import sys
from pathlib import Path

import pytest
from fastapi import HTTPException

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import main as backend_main


def setup_function() -> None:
    backend_main.API_TOKEN = ""
    backend_main.device_state["light1"] = False
    backend_main.device_state["light2"] = False


def test_health_returns_ok() -> None:
    assert backend_main.health() == {"status": "ok"}


def test_dependency_health_shape() -> None:
    payload = backend_main.dependency_health()
    assert "vosk_model_exists" in payload
    assert "ollama_service_reachable" in payload
    assert "ollama_model_available" in payload


def test_apply_device_action_updates_state(monkeypatch) -> None:
    monkeypatch.setattr(backend_main, "_call_esp", lambda *_: True)
    ok = backend_main._apply_device_action("light1", "on")
    assert ok is True
    assert backend_main.device_state["light1"] is True


def test_apply_device_action_rejects_invalid_device() -> None:
    with pytest.raises(HTTPException):
        backend_main._apply_device_action("fan1", "on")


def test_verify_api_token_allows_when_unset() -> None:
    backend_main.API_TOKEN = ""
    backend_main._verify_api_token(None)


def test_verify_api_token_rejects_invalid_token() -> None:
    backend_main.API_TOKEN = "secret"
    with pytest.raises(HTTPException):
        backend_main._verify_api_token("bad-token")


def test_transcribe_rejects_invalid_wav_payload() -> None:
    with pytest.raises(HTTPException):
        backend_main._transcribe_wav_bytes(b"not-a-wav")
