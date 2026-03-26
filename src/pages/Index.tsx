import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import VoiceEngine from "@/components/VoiceEngine";
import LightRelayCard from "@/components/LightRelayCard";
import ActivityLogCard, { LogEntry } from "@/components/ActivityLogCard";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

function authHeaders() {
  return API_TOKEN ? { "X-API-Token": API_TOKEN } : {};
}

interface DeviceState {
  light1: boolean;
  light2: boolean;
}

async function sendAudioToBackend(blob: Blob) {
  const formData = new FormData();
  formData.append("audio", blob, "recording.wav");
  const res = await fetch(`${API_BASE}/api/voice`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    throw new Error(`Voice request failed: ${res.status}`);
  }
  return res.json();
}

async function toggleDevice(deviceId: string, newState: boolean) {
  const res = await fetch(`${API_BASE}/api/devices/control`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ device_id: deviceId, state: newState }),
  });
  if (!res.ok) {
    throw new Error(`Control request failed: ${res.status}`);
  }
  return res.json();
}

const Index = () => {
  const [devices, setDevices] = useState<DeviceState>({
    light1: false,
    light2: false,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    logIdRef.current += 1;
    setLogs((prev) => [
      { id: String(logIdRef.current), timestamp: new Date(), message, type },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const handleRecordingComplete = useCallback(
    async (blob: Blob) => {
      setIsProcessing(true);
      try {
        const data = await sendAudioToBackend(blob);
        setLastCommand(data.transcript || "Command received");
        if (data.device_state) {
          setDevices({
            light1: data.device_state.light1 ?? false,
            light2: data.device_state.light2 ?? false,
          });
        }
        setIsConnected(true);
        addLog(data.transcript || "Voice command processed", "command");
        toast.success("Voice command processed");
      } catch {
        toast.error("Failed to send audio — backend unreachable");
        setIsConnected(false);
        addLog("Voice command failed — backend unreachable", "system");
      } finally {
        setIsProcessing(false);
      }
    },
    [addLog]
  );

  const { startRecording, stopRecording, isRecording } =
    useAudioRecorder(handleRecordingComplete);

  // Poll device status every 3s
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/devices/status`, {
          headers: authHeaders(),
        });
        if (!res.ok) {
          throw new Error(`Status request failed: ${res.status}`);
        }
        const data = await res.json();
        setDevices({
          light1: data.light1 ?? false,
          light2: data.light2 ?? false,
        });
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleLight = async (id: "light1" | "light2", val: boolean) => {
    const label = id === "light1" ? "Light 1" : "Light 2";
    setDevices((prev) => ({ ...prev, [id]: val }));
    addLog(`${label} turned ${val ? "on" : "off"}`, "device");
    try {
      const data = await toggleDevice(id, val);
      if (data.device_state) {
        setDevices({
          light1: data.device_state.light1 ?? false,
          light2: data.device_state.light2 ?? false,
        });
      }
      toast.success(`${label} turned ${val ? "on" : "off"}`);
    } catch {
      toast.error(`Failed to toggle ${label}`);
      setDevices((prev) => ({ ...prev, [id]: !val }));
      addLog(`${label} toggle failed`, "system");
    }
  };

  return (
    <div className="ambient-mesh min-h-screen relative">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        <Header isConnected={isConnected} />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voice Engine — spans 2 cols */}
          <VoiceEngine
            isRecording={isRecording}
            isProcessing={isProcessing}
            lastCommand={lastCommand}
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
          />

          {/* Light relay cards */}
          <LightRelayCard
            label="Light 1"
            isOn={devices.light1}
            onToggle={(v) => handleToggleLight("light1", v)}
          />
          <LightRelayCard
            label="Light 2"
            isOn={devices.light2}
            onToggle={(v) => handleToggleLight("light2", v)}
          />

          {/* Activity Log — spans 2 cols */}
          <div className="md:col-span-2">
            <ActivityLogCard logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
