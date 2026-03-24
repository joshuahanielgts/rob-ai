import { Snowflake } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

interface ACCardProps {
  isOn: boolean;
  temperature: number;
  onToggle: (val: boolean) => void;
  onTempChange: (temp: number) => void;
}

const ACCard = ({ isOn, temperature, onToggle, onTempChange }: ACCardProps) => {
  return (
    <motion.div
      layout
      className={`glass-card p-6 flex flex-col gap-5 transition-shadow duration-500 ${
        isOn ? "neon-underglow-purple" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bedroom AC</h3>
        <Switch checked={isOn} onCheckedChange={onToggle} />
      </div>

      <div className="flex items-center justify-center py-2">
        <div
          className={`p-4 rounded-full ${
            isOn ? "bg-primary/10" : "bg-secondary"
          }`}
        >
          <Snowflake
            size={40}
            className={`transition-colors ${
              isOn ? "text-primary animate-pulse-glow" : "text-muted-foreground"
            }`}
          />
        </div>
      </div>

      <div className="text-center">
        <span
          className={`text-3xl font-bold tabular-nums ${
            isOn ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {temperature}°C
        </span>
      </div>

      <input
        type="range"
        min={16}
        max={30}
        value={temperature}
        onChange={(e) => onTempChange(Number(e.target.value))}
        disabled={!isOn}
        className={`temp-slider w-full ${isOn ? "active" : ""}`}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>16°C</span>
        <span>30°C</span>
      </div>
    </motion.div>
  );
};

export default ACCard;
