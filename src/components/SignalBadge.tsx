import { motion } from "framer-motion";
import { Signal, getSignalColor, getSignalGlow } from "@/lib/predictions";
import { TrendingUp, TrendingDown, Minus, ArrowDownToLine } from "lucide-react";

interface SignalBadgeProps {
  signal: Signal;
  size?: "sm" | "lg";
}

const signalLabels: Record<Signal, string> = {
  STRONG_BUY:  "STRONG BUY",
  BUY:         "BUY",
  HOLD:        "HOLD",
  SELL:        "SELL",
  STRONG_SELL: "STRONG SELL",
  SHORT:       "SHORT",
};

const signalStyles: Record<Signal, { bg: string; border: string }> = {
  STRONG_BUY:  { bg: "bg-gain/15",           border: "border-gain/30" },
  BUY:         { bg: "bg-gain/10",            border: "border-gain/20" },
  HOLD:        { bg: "bg-warn/10",            border: "border-warn/20" },
  SELL:        { bg: "bg-loss/10",            border: "border-loss/20" },
  STRONG_SELL: { bg: "bg-loss/15",            border: "border-loss/30" },
  SHORT:       { bg: "bg-[hsl(var(--signal-short))]/10", border: "border-[hsl(var(--signal-short))]/20" },
};

function SignalIcon({ signal, size }: { signal: Signal; size: number }) {
  const cls = `shrink-0`;
  const style = { width: size, height: size };
  switch (signal) {
    case "STRONG_BUY":
    case "BUY":        return <TrendingUp  className={cls} style={style} />;
    case "SELL":
    case "STRONG_SELL":return <TrendingDown className={cls} style={style} />;
    case "SHORT":      return <ArrowDownToLine className={cls} style={style} />;
    default:           return <Minus className={cls} style={style} />;
  }
}

export default function SignalBadge({ signal, size = "sm" }: SignalBadgeProps) {
  const colorClass = getSignalColor(signal);
  const glowClass  = getSignalGlow(signal);
  const isLarge    = size === "lg";
  const { bg, border } = signalStyles[signal];

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-xl border ${bg} ${border} ${glowClass} ${
        isLarge ? "px-5 py-3" : "px-2.5 py-1.5"
      }`}
    >
      <span className={colorClass}>
        <SignalIcon signal={signal} size={isLarge ? 18 : 12} />
      </span>
      <span className={`font-bold tracking-wider ${colorClass} ${isLarge ? "text-lg" : "text-[10px]"}`}>
        {signalLabels[signal]}
      </span>
    </motion.div>
  );
}
