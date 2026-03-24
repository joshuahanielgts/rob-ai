import { Film, Sun, Moon, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";

const scenes = [
  {
    id: "movie-night",
    label: "Movie Night",
    icon: Film,
    description: "Dim lights, AC to 22°C",
    color: "neon-purple",
  },
  {
    id: "good-morning",
    label: "Good Morning",
    icon: Sun,
    description: "Bright lights, fan on",
    color: "neon-blue",
  },
  {
    id: "sleep-mode",
    label: "Sleep Mode",
    icon: Moon,
    description: "All off, AC to 24°C",
    color: "neon-green",
  },
  {
    id: "energy-saver",
    label: "Energy Saver",
    icon: Zap,
    description: "Minimal power usage",
    color: "neon-blue",
  },
];

const colorMap: Record<string, string> = {
  "neon-purple": "text-neon-purple bg-neon-purple/10 border-neon-purple/20",
  "neon-blue": "text-neon-blue bg-neon-blue/10 border-neon-blue/20",
  "neon-green": "text-neon-green bg-neon-green/10 border-neon-green/20",
};

const glowMap: Record<string, string> = {
  "neon-purple": "neon-underglow-purple",
  "neon-blue": "neon-underglow-blue",
  "neon-green": "neon-glow-green",
};

interface SceneCardProps {
  onActivateScene?: (sceneId: string) => void;
}

const SceneCard = ({ onActivateScene }: SceneCardProps) => {
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const handleActivate = (sceneId: string, label: string) => {
    setActiveScene(sceneId);
    onActivateScene?.(sceneId);
    toast.success(`Scene "${label}" activated`);
  };

  return (
    <motion.div layout className="glass-card p-6 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">Scene Automation</h3>
      <div className="grid grid-cols-2 gap-3">
        {scenes.map((scene) => {
          const Icon = scene.icon;
          const isActive = activeScene === scene.id;
          return (
            <motion.button
              key={scene.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleActivate(scene.id, scene.label)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? `${colorMap[scene.color]} ${glowMap[scene.color]}`
                  : "bg-secondary/50 border-white/[0.06] text-muted-foreground hover:border-white/[0.12]"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{scene.label}</span>
              <span className="text-[10px] opacity-60">{scene.description}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default SceneCard;
