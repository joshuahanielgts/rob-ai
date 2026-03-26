import { useCallback, useRef, useState } from "react";

interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isRecording: boolean;
}

export function useAudioRecorder(
  onRecordingComplete: (blob: Blob) => void
): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const buffersRef = useRef<Float32Array[]>([]);

  const mergeBuffers = (buffers: Float32Array[]) => {
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const result = new Float32Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
      result.set(buffer, offset);
      offset += buffer.length;
    }

    return result;
  };

  const downsampleBuffer = (
    buffer: Float32Array,
    sourceRate: number,
    targetRate: number
  ) => {
    if (sourceRate === targetRate) return buffer;

    const ratio = sourceRate / targetRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < newLength) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;

      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i += 1
      ) {
        accum += buffer[i];
        count += 1;
      }

      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult += 1;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  };

  const encodeWav = (samples: Float32Array, sampleRate: number) => {
    const bytesPerSample = 2;
    const blockAlign = bytesPerSample;
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);

    const writeString = (offset: number, text: string) => {
      for (let i = 0; i < text.length; i += 1) {
        view.setUint8(offset + i, text.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, samples.length * bytesPerSample, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i += 1) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const gain = audioContext.createGain();

      gain.gain.value = 0;
      buffersRef.current = [];
      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0);
        buffersRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(gain);
      gain.connect(audioContext.destination);

      streamRef.current = stream;
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      processorRef.current = processor;
      gainRef.current = gain;
      setIsRecording(true);
    } catch {
      console.error("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    gainRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const audioContext = audioContextRef.current;
    const sampleRate = audioContext?.sampleRate ?? 44100;
    const merged = mergeBuffers(buffersRef.current);
    const downsampled = downsampleBuffer(merged, sampleRate, 16000);
    const wavBlob = encodeWav(downsampled, 16000);

    audioContext?.close();
    streamRef.current = null;
    audioContextRef.current = null;
    sourceRef.current = null;
    processorRef.current = null;
    gainRef.current = null;
    buffersRef.current = [];

    setIsRecording(false);
    onRecordingComplete(wavBlob);
  }, [isRecording, onRecordingComplete]);

  return { startRecording, stopRecording, isRecording };
}
