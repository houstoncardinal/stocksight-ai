import { motion } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Prediction } from "@/lib/predictions";
import SignalBadge from "./SignalBadge";
import { TrendingUp, TrendingDown, Cpu, ArrowRight, HelpCircle } from "lucide-react";

interface PredictionPanelProps {
  predictions: Prediction[];
  currentPrice: number;
}

function confidenceFactors(pred: Prediction): string[] {
  const factors: string[] = [];
  const periods = pred.timeFrame === "1D" ? 1 : pred.timeFrame === "1W" ? 5 : pred.timeFrame === "1M" ? 22 : 252;

  if (periods >= 252) factors.push("Long time horizon increases model uncertainty");
  else if (periods >= 22) factors.push("Monthly projections carry elevated noise");

  if (pred.confidence < 50) {
    factors.push("Ensemble models show divergent forecasts");
    factors.push("High recent volatility reduces signal quality");
  }
  if (Math.abs(pred.changePercent) > 15) {
    factors.push("Large predicted move lowers statistical confidence");
  }
  if (factors.length === 0) factors.push("Model agreement is strong for this timeframe");
  return factors;
}

export default function PredictionPanel({ predictions, currentPrice }: PredictionPanelProps) {
  const fmt = (p: number) =>
    p < 1
      ? `$${p.toFixed(6)}`
      : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const maxAbsChange = Math.max(...predictions.map(p => Math.abs(p.changePercent)));

  return (
    <Tooltip.Provider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="panel-card h-full"
      >
        {/* Accent line */}
        <div className="card-accent-line" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Price Predictions</h3>
              <p className="text-[10px] text-muted-foreground">Holt · WMA · Adaptive ensemble</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3" />
            Current: <span className="font-bold font-mono text-foreground ml-1">{fmt(currentPrice)}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 h-full">
          {predictions.map((pred, i) => {
            const isPos = pred.changePercent >= 0;
            const barWidth = maxAbsChange > 0 ? (Math.abs(pred.changePercent) / maxAbsChange) * 100 : 0;
            const isLowConf = pred.confidence < 50;
            const factors = confidenceFactors(pred);

            return (
              <motion.div
                key={pred.timeFrame}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className={`relative flex flex-col items-center gap-4 p-5 transition-colors duration-150 ${
                  isLowConf
                    ? "bg-warn/[0.02] hover:bg-warn/[0.05]"
                    : "hover:bg-secondary/20"
                } ${i < predictions.length - 1 ? "border-r border-border/60" : ""} ${
                  i >= 2 ? "border-t border-border/60 lg:border-t-0" : ""
                }`}
              >
                {/* Subtle background bar */}
                <div
                  className={`absolute bottom-0 left-0 right-0 rounded-b-none opacity-[0.035] ${isPos ? "bg-gain" : "bg-loss"}`}
                  style={{ height: `${barWidth}%` }}
                />

                {/* Low-confidence warning stripe */}
                {isLowConf && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-warn/40 via-warn/70 to-warn/40" />
                )}

                {/* Timeframe */}
                <div className="relative z-10 text-center">
                  <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isLowConf ? "text-warn/70" : "text-muted-foreground"}`}>
                    {pred.label}
                  </span>
                </div>

                {/* Price */}
                <div className="relative z-10 text-center">
                  <div className={`text-xl font-bold font-mono tracking-tight ${isLowConf ? "text-foreground/70" : "text-foreground"}`}>
                    {fmt(pred.predictedPrice)}
                  </div>
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.07 }}
                    className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isPos
                        ? "bg-gain/10 text-gain border border-gain/20"
                        : "bg-loss/10 text-loss border border-loss/20"
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPos ? "+" : ""}{pred.changePercent.toFixed(2)}%
                  </motion.div>
                </div>

                {/* Signal */}
                <div className="relative z-10">
                  <SignalBadge signal={pred.signal} />
                </div>

                {/* Confidence with tooltip */}
                <div className="relative z-10 w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Confidence</span>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button className="flex items-center gap-1 cursor-help">
                          <span className={`text-[10px] font-bold font-mono ${
                            pred.confidence >= 70 ? "text-gain" :
                            pred.confidence >= 50 ? "text-warn" : "text-warn"
                          }`}>
                            {pred.confidence.toFixed(0)}%
                          </span>
                          {isLowConf && (
                            <HelpCircle className="w-3 h-3 text-warn/60" />
                          )}
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="top"
                          align="center"
                          sideOffset={6}
                          className="z-50 max-w-[220px] rounded-xl bg-card border border-border/80 px-3.5 py-3 shadow-xl"
                        >
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            {isLowConf ? "Why low confidence?" : "Confidence factors"}
                          </p>
                          <ul className="space-y-1.5">
                            {factors.map((f, fi) => (
                              <li key={fi} className="flex items-start gap-1.5 text-[11px] text-foreground/80">
                                <span className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${isLowConf ? "bg-warn" : "bg-gain"}`} />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <Tooltip.Arrow className="fill-border" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pred.confidence}%` }}
                      transition={{ delay: 0.45 + i * 0.08, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="h-full rounded-full"
                      style={{
                        background: pred.confidence >= 70
                          ? "linear-gradient(90deg, hsl(var(--gain)), hsl(var(--primary)))"
                          : pred.confidence >= 50
                          ? "linear-gradient(90deg, hsl(var(--warn)), hsl(var(--accent)))"
                          : "linear-gradient(90deg, hsl(var(--warn)/0.7), hsl(var(--warn)))",
                      }}
                    />
                  </div>
                  {isLowConf && (
                    <p className="text-[9px] text-warn/70 mt-1.5 text-center leading-tight">
                      Use with caution — model uncertainty is elevated
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </Tooltip.Provider>
  );
}
