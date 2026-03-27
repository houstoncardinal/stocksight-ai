import { motion } from "framer-motion";
import { FibonacciLevels } from "@/lib/algorithms";
import { GitBranch, TrendingDown, TrendingUp } from "lucide-react";

interface FibonacciPanelProps {
  fibLevels: FibonacciLevels;
  currentPrice: number;
  supportLevels: number[];
  resistanceLevels: number[];
}

export default function FibonacciPanel({
  fibLevels, currentPrice, supportLevels, resistanceLevels,
}: FibonacciPanelProps) {
  const fmt = (p: number) =>
    p < 1
      ? `$${p.toFixed(6)}`
      : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const range = fibLevels.high - fibLevels.low;
  const pricePos = range > 0 ? ((currentPrice - fibLevels.low) / range) * 100 : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card relative rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-warn/10 border border-warn/20 flex items-center justify-center">
          <GitBranch className="w-3.5 h-3.5 text-warn" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Fibonacci Retracement</h3>
          <p className="text-[10px] text-muted-foreground">Key support & resistance levels</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border/60">

        {/* ── Fibonacci Levels ── */}
        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Fib Levels
          </p>
          <div className="space-y-1">
            {fibLevels.levels.map((level, i) => {
              const isNear = Math.abs(level.price - currentPrice) / currentPrice < 0.02;
              const pct = range > 0 ? ((level.price - fibLevels.low) / range) * 100 : 50;
              return (
                <motion.div
                  key={level.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.04 }}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    isNear
                      ? "bg-warn/8 border border-warn/20"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  {/* Mini color bar */}
                  <div
                    className="w-1.5 h-6 rounded-full flex-shrink-0"
                    style={{
                      background: `hsl(${Math.round(120 - pct * 1.2)} 70% 50%)`,
                      opacity: 0.7,
                    }}
                  />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div>
                      <span className={`text-xs font-bold ${isNear ? "text-warn" : "text-muted-foreground"}`}>
                        {level.label}
                      </span>
                      {isNear && (
                        <span className="ml-2 text-[9px] font-bold text-warn bg-warn/10 px-1.5 py-0.5 rounded-full">
                          NEAR
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold font-mono ${isNear ? "text-warn" : "text-foreground"}`}>
                      {fmt(level.price)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Price Position Gauge ── */}
        <div className="p-5 flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 self-start">
            Price Position
          </p>

          <div className="flex-1 flex items-center gap-6 w-full justify-center">
            {/* Vertical track */}
            <div className="relative h-48 flex flex-col items-center">
              {/* Track */}
              <div className="relative w-3 h-full rounded-full bg-secondary overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-loss/30 via-warn/20 to-gain/30 rounded-full" />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pricePos}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-loss via-warn to-gain"
                />
              </div>

              {/* Thumb */}
              <motion.div
                initial={{ bottom: "0%" }}
                animate={{ bottom: `${pricePos}%` }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute left-1/2 -translate-x-1/2"
                style={{ bottom: `${pricePos}%` }}
              >
                <div className="relative flex items-center gap-2 -translate-y-1/2">
                  <div className="w-5 h-5 rounded-full bg-foreground border-2 border-background shadow-lg z-10" />
                  <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 shadow-md whitespace-nowrap">
                    <span className="text-[11px] font-bold font-mono text-foreground">{fmt(currentPrice)}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Labels */}
            <div className="flex flex-col justify-between h-48 text-[10px] font-mono font-medium text-muted-foreground">
              <span className="text-gain">{fmt(fibLevels.high)}</span>
              <span>{fmt((fibLevels.high + fibLevels.low) / 2)}</span>
              <span className="text-loss">{fmt(fibLevels.low)}</span>
            </div>
          </div>

          {/* Position % badge */}
          <div className="mt-4 px-3 py-1.5 rounded-full bg-secondary border border-border/60 text-xs font-bold font-mono text-foreground">
            {pricePos.toFixed(1)}% of range
          </div>
        </div>

        {/* ── Support & Resistance ── */}
        <div className="p-5 space-y-5">
          {/* Resistance */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-loss/10 border border-loss/20 flex items-center justify-center">
                <TrendingDown className="w-3 h-3 text-loss" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-loss">Resistance</span>
            </div>
            <div className="space-y-1.5">
              {resistanceLevels.length > 0 ? (
                resistanceLevels.slice(0, 4).map((r, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-loss/5 border border-loss/10 hover:bg-loss/8 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-loss/15 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-loss">R{i + 1}</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        +{(((r - currentPrice) / currentPrice) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono text-loss">{fmt(r)}</span>
                  </motion.div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-3">No levels detected</p>
              )}
            </div>
          </div>

          {/* Support */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-gain/10 border border-gain/20 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-gain" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gain">Support</span>
            </div>
            <div className="space-y-1.5">
              {supportLevels.length > 0 ? (
                supportLevels.slice(0, 4).map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-gain/5 border border-gain/10 hover:bg-gain/8 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gain/15 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-gain">S{i + 1}</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {(((s - currentPrice) / currentPrice) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono text-gain">{fmt(s)}</span>
                  </motion.div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground px-3">No levels detected</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
