import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const presetColors = [
  { label: "Warm", hsl: "35 90% 55%" },
  { label: "Cool", hsl: "200 90% 55%" },
  { label: "Purple", hsl: "270 80% 60%" },
  { label: "Green", hsl: "142 70% 49%" },
  { label: "Pink", hsl: "330 80% 60%" },
  { label: "White", hsl: "0 0% 90%" },
];

interface LightingCardProps {
  isOn: boolean;
  onToggle: (val: boolean) => void;
  onColorChange?: (color: string) => void;
  onBrightnessChange?: (brightness: number) => void;
}

const LightingCard = ({ isOn, onToggle, onColorChange, onBrightnessChange }: LightingCardProps) => {
  const [selectedColor, setSelectedColor] = useState(presetColors[0].hsl);
  const [brightness, setBrightness] = useState(75);

  const handleColor = (hsl: string) => {
    setSelectedColor(hsl);
    onColorChange?.(hsl);
  };

  const handleBrightness = (val: number) => {
    setBrightness(val);
    onBrightnessChange?.(val);
  };

  return (
    <motion.div
      layout
      className={`glass-card p-6 flex flex-col gap-5 transition-shadow duration-500 ${
        isOn ? "neon-underglow-purple" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Smart Lighting</h3>
        <Switch checked={isOn} onCheckedChange={onToggle} />
      </div>

      <div className="flex items-center justify-center py-2">
        <div
          className="p-4 rounded-full transition-all duration-500"
          style={{
            backgroundColor: isOn ? `hsl(${selectedColor} / 0.15)` : undefined,
            boxShadow: isOn ? `0 0 30px hsl(${selectedColor} / 0.3)` : undefined,
          }}
        >
          <Lightbulb
            size={36}
            className="transition-colors"
            style={{ color: isOn ? `hsl(${selectedColor})` : undefined }}
          />
        </div>
      </div>

      {/* Color picker */}
      <div className="flex gap-2 justify-center">
        {presetColors.map((c) => (
          <button
            key={c.label}
            onClick={() => handleColor(c.hsl)}
            title={c.label}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              selectedColor === c.hsl ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: `hsl(${c.hsl})` }}
          />
        ))}
      </div>

      {/* Brightness slider */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
          <span>Brightness</span>
          <span>{brightness}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={brightness}
          onChange={(e) => handleBrightness(Number(e.target.value))}
          className={`temp-slider w-full ${isOn ? "active" : ""}`}
          disabled={!isOn}
        />
      </div>
    </motion.div>
  );
};

export default LightingCard;
