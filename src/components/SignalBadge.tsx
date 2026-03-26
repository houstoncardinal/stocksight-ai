import { motion } from "framer-motion";
import { Signal, getSignalColor, getSignalGlow } from "@/lib/predictions";
import { TrendingUp, TrendingDown, Minus, ArrowDownToLine } from "lucide-react";

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

const signalBg: Record<Signal, string> = {
  STRONG_BUY: "bg-gain/15",
  BUY: "bg-gain/10",
  HOLD: "bg-warn/10",
  SELL: "bg-loss/10",
  STRONG_SELL: "bg-loss/15",
  SHORT: "bg-signal-short/10",
};

function SignalIcon({ signal, size }: { signal: Signal; size: number }) {
  const props = { className: `w-${size} h-${size}`, style: { width: size * 4, height: size * 4 } };
  switch (signal) {
    case "STRONG_BUY":
    case "BUY":
      return <TrendingUp {...props} />;
    case "SELL":
    case "STRONG_SELL":
      return <TrendingDown {...props} />;
    case "SHORT":
      return <ArrowDownToLine {...props} />;
    default:
      return <Minus {...props} />;
  }
}

export default function SignalBadge({ signal, size = "sm" }: SignalBadgeProps) {
  const colorClass = getSignalColor(signal);
  const glowClass = getSignalGlow(signal);
  const isLarge = size === "lg";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center gap-2 rounded-lg border border-border/50 ${signalBg[signal]} ${glowClass} ${
        isLarge ? "px-6 py-3.5" : "px-3 py-1.5"
      }`}
    >
      <span className={colorClass}>
        <SignalIcon signal={signal} size={isLarge ? 5 : 3} />
      </span>
      <span className={`font-mono font-bold tracking-wider ${colorClass} ${isLarge ? "text-xl" : "text-xs"}`}>
        {signalLabels[signal]}
      </span>
    </motion.div>
  );
}
