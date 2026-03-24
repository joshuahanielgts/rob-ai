import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: "command" | "device" | "scene" | "system";
}

const typeColors: Record<LogEntry["type"], string> = {
  command: "text-neon-purple",
  device: "text-neon-blue",
  scene: "text-neon-green",
  system: "text-muted-foreground",
};

const typeBadge: Record<LogEntry["type"], string> = {
  command: "bg-neon-purple/10 text-neon-purple",
  device: "bg-neon-blue/10 text-neon-blue",
  scene: "bg-neon-green/10 text-neon-green",
  system: "bg-secondary text-muted-foreground",
};

interface ActivityLogCardProps {
  logs: LogEntry[];
}

const ActivityLogCard = ({ logs }: ActivityLogCardProps) => {
  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <motion.div layout className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Clock size={14} className="text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
      </div>

      <ScrollArea className="h-48 pr-2">
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No activity yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0"
              >
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5 shrink-0">
                  {formatTime(entry.timestamp)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${typeBadge[entry.type]}`}>
                  {entry.type}
                </span>
                <span className={`text-xs ${typeColors[entry.type]}`}>{entry.message}</span>
              </motion.div>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
};

export default ActivityLogCard;
