import { motion } from "framer-motion";
import { Prediction } from "@/lib/predictions";
import SignalBadge from "./SignalBadge";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

interface PredictionPanelProps {
  predictions: Prediction[];
  currentPrice: number;
}

export default function PredictionPanel({ predictions, currentPrice }: PredictionPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card relative rounded-xl overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-accent" />
        <h3 className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
          Price Predictions
        </h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {predictions.map((pred, i) => {
          const isPositive = pred.changePercent >= 0;
          const priceDiff = pred.predictedPrice - currentPrice;
          return (
            <motion.div
              key={pred.timeFrame}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className={`p-5 flex flex-col items-center gap-3 hover:bg-secondary/20 transition-colors ${
                i < 3 ? "border-r border-border" : ""
              }`}
            >
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                {pred.label}
              </span>

              <span className="text-xl font-mono font-bold text-foreground">
                {pred.predictedPrice < 1 ? `$${pred.predictedPrice.toFixed(6)}` : `$${pred.predictedPrice.toFixed(2)}`}
              </span>

              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{pred.changePercent.toFixed(2)}%
              </div>

              <SignalBadge signal={pred.signal} />

              <div className="w-full mt-1">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                  <span>Confidence</span>
                  <span className="text-foreground/70">{pred.confidence.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.confidence}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
