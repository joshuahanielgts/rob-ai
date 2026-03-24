import { Fan } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

interface FanCardProps {
  isOn: boolean;
  onToggle: (val: boolean) => void;
}

const FanCard = ({ isOn, onToggle }: FanCardProps) => {
  return (
    <motion.div
      layout
      className={`glass-card p-6 flex flex-col gap-5 transition-shadow duration-500 ${
        isOn ? "neon-underglow-blue" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Bedroom Fan</h3>
        <Switch checked={isOn} onCheckedChange={onToggle} />
      </div>

      <div className="flex items-center justify-center py-4">
        <div
          className={`p-4 rounded-full ${
            isOn ? "bg-neon-blue/10" : "bg-secondary"
          }`}
        >
          <Fan
            size={40}
            className={`transition-colors ${
              isOn
                ? "text-neon-blue animate-spin-slow"
                : "text-muted-foreground"
            }`}
          />
        </div>
      </div>

      <p
        className={`text-center text-xs font-medium uppercase tracking-wider ${
          isOn ? "text-neon-blue" : "text-muted-foreground"
        }`}
      >
        {isOn ? "Running" : "Off"}
      </p>
    </motion.div>
  );
};

export default FanCard;
