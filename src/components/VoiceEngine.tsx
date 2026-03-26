import { Mic, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { KeyboardEvent } from "react";

interface VoiceEngineProps {
  isRecording: boolean;
  isProcessing: boolean;
  lastCommand: string;
  onPointerDown: () => void;
  onPointerUp: () => void;
}

const SonarRings = () => (
  <>
    {[0, 0.4, 0.8].map((delay) => (
      <motion.div
        key={delay}
        className="absolute inset-0 rounded-full border-2 border-primary/40"
        initial={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{
          duration: 1.5,
          delay,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    ))}
  </>
);

const VoiceEngine = ({
  isRecording,
  isProcessing,
  lastCommand,
  onPointerDown,
  onPointerUp,
}: VoiceEngineProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      onPointerDown();
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onPointerUp();
    }
  };

  return (
    <div className="glass-card col-span-1 md:col-span-2 p-8 flex flex-col items-center gap-6">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Voice Engine
      </h2>

      {/* Mic button */}
      <div className="relative flex items-center justify-center w-36 h-36">
        <AnimatePresence>{isRecording && <SonarRings />}</AnimatePresence>

        <motion.button
          type="button"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onBlur={onPointerUp}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onContextMenu={(e) => e.preventDefault()}
          whileTap={{ scale: 0.92 }}
          style={{ touchAction: "none" }}
          className={`relative z-10 flex items-center justify-center w-24 h-24 rounded-full cursor-pointer transition-colors duration-300 select-none ${
            isRecording
              ? "bg-primary/20 neon-glow-purple"
              : "bg-secondary hover:bg-secondary/80"
          }`}
          aria-label="Hold to speak"
        >
          <Mic
            size={36}
            className={`transition-colors ${
              isRecording ? "text-primary" : "text-muted-foreground"
            }`}
          />
        </motion.button>
      </div>

      <p className="text-xs text-muted-foreground">Hold to speak</p>

      {/* Processing state */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-primary text-sm"
          >
            <Loader2 size={16} className="animate-spin" />
            Aegis AI is parsing intent…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcription log */}
      <div className="w-full max-w-md bg-background/50 rounded-xl border border-border px-4 py-3 text-sm text-foreground/80 min-h-[48px]">
        <span className="text-muted-foreground text-xs block mb-1">
          Last Command
        </span>
        {lastCommand || (
          <span className="text-muted-foreground italic">
            Awaiting voice command…
          </span>
        )}
      </div>
    </div>
  );
};

export default VoiceEngine;
