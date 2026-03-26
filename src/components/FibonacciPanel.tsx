import { motion } from "framer-motion";
import { FibonacciLevels } from "@/lib/algorithms";

interface FibonacciPanelProps {
  fibLevels: FibonacciLevels;
  currentPrice: number;
  supportLevels: number[];
  resistanceLevels: number[];
}

export default function FibonacciPanel({ fibLevels, currentPrice, supportLevels, resistanceLevels }: FibonacciPanelProps) {
  const formatPrice = (p: number) =>
    p < 1 ? `$${p.toFixed(6)}` : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const range = fibLevels.high - fibLevels.low;
  const pricePos = range > 0 ? ((currentPrice - fibLevels.low) / range) * 100 : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card relative rounded-xl overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border">
        <h3 className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
          Fibonacci Retracement & Key Levels
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Fibonacci Levels */}
        <div className="p-4 col-span-1">
          <div className="text-[10px] font-mono text-muted-foreground mb-3 uppercase tracking-wider">
            Fibonacci Levels
          </div>
          <div className="relative space-y-0">
            {fibLevels.levels.map((level, i) => {
              const isNearPrice = Math.abs(level.price - currentPrice) / currentPrice < 0.02;
              return (
                <motion.div
                  key={level.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className={`flex items-center justify-between py-1.5 px-2 rounded ${
                    isNearPrice ? "bg-primary/10" : ""
                  }`}
                >
                  <span className={`text-xs font-mono ${isNearPrice ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {level.label}
                  </span>
                  <span className={`text-xs font-mono font-semibold ${isNearPrice ? "text-primary" : "text-foreground"}`}>
                    {formatPrice(level.price)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Visual Level Map */}
        <div className="p-4 col-span-1 flex flex-col items-center justify-center">
          <div className="text-[10px] font-mono text-muted-foreground mb-3 uppercase tracking-wider text-center">
            Price Position
          </div>
          <div className="relative w-full h-[180px] flex items-center justify-center">
            {/* Vertical bar */}
            <div className="relative w-3 h-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pricePos}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-loss via-warn to-gain"
              />
            </div>
            {/* Price marker */}
            <motion.div
              initial={{ bottom: 0 }}
              animate={{ bottom: `${pricePos}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            >
              <div className="w-5 h-5 rounded-full bg-foreground border-2 border-background shadow-lg" />
              <div className="bg-card border border-border rounded px-2 py-1">
                <span className="text-[10px] font-mono font-bold text-foreground">
                  {formatPrice(currentPrice)}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Support & Resistance */}
        <div className="p-4 col-span-1">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-mono text-loss mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-loss" /> Resistance
              </div>
              {resistanceLevels.length > 0 ? (
                resistanceLevels.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-xs font-mono text-muted-foreground">R{i + 1}</span>
                    <span className="text-xs font-mono font-semibold text-loss">{formatPrice(r)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-mono text-muted-foreground">No resistance levels detected</p>
              )}
            </div>
            <div>
              <div className="text-[10px] font-mono text-gain mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-gain" /> Support
              </div>
              {supportLevels.length > 0 ? (
                supportLevels.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-xs font-mono text-muted-foreground">S{i + 1}</span>
                    <span className="text-xs font-mono font-semibold text-gain">{formatPrice(s)}</span>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-mono text-muted-foreground">No support levels detected</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
