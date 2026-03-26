import { motion } from "framer-motion";
import { Signal, getSignalColor, getSignalGlow } from "@/lib/predictions";

interface SignalBadgeProps {
  signal: Signal;
  size?: "sm" | "lg";
}

const signalLabels: Record<Signal, string> = {
  STRONG_BUY: "STRONG BUY",
  BUY: "BUY",
  HOLD: "HOLD",
  SELL: "SELL",
  STRONG_SELL: "STRONG SELL",
  SHORT: "SHORT",
};

const signalIcons: Record<Signal, string> = {
  STRONG_BUY: "▲▲",
  BUY: "▲",
  HOLD: "◆",
  SELL: "▼",
  STRONG_SELL: "▼▼",
  SHORT: "⇊",
};

export default function SignalBadge({ signal, size = "sm" }: SignalBadgeProps) {
  const colorClass = getSignalColor(signal);
  const glowClass = getSignalGlow(signal);
  const isLarge = size === "lg";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border terminal-border ${glowClass} ${
        isLarge ? "px-5 py-3" : ""
      }`}
    >
      <span className={`font-mono font-bold ${colorClass} ${isLarge ? "text-xl" : "text-xs"}`}>
        {signalIcons[signal]}
      </span>
      <span className={`font-mono font-semibold tracking-wider ${colorClass} ${isLarge ? "text-lg" : "text-xs"}`}>
        {signalLabels[signal]}
      </span>
    </motion.div>
  );
}
