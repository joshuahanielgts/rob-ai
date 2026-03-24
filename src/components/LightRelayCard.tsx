import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

interface LightRelayCardProps {
  label: string;
  isOn: boolean;
  onToggle: (val: boolean) => void;
}

const LightRelayCard = ({ label, isOn, onToggle }: LightRelayCardProps) => {
  return (
    <motion.div
      layout
      className={`glass-card p-6 flex flex-col items-center gap-5 transition-shadow duration-500 ${
        isOn ? "neon-underglow-yellow" : ""
      }`}
    >
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </h3>

      <motion.div
        animate={{ scale: isOn ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative flex items-center justify-center"
      >
        {isOn && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background:
                "radial-gradient(circle, hsl(45 90% 55% / 0.25) 0%, transparent 70%)",
              width: 80,
              height: 80,
              top: -16,
              left: -16,
            }}
          />
        )}
        <Lightbulb
          size={48}
          className={`transition-colors duration-300 ${
            isOn ? "text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" : "text-muted-foreground"
          }`}
        />
      </motion.div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">{isOn ? "ON" : "OFF"}</span>
        <Switch checked={isOn} onCheckedChange={onToggle} />
      </div>
    </motion.div>
  );
};

export default LightRelayCard;
