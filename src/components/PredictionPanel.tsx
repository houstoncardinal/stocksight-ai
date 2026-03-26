import { motion } from "framer-motion";
import { Prediction } from "@/lib/predictions";
import SignalBadge from "./SignalBadge";

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
      className="terminal-border rounded-lg"
    >
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
          Price Predictions
        </h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
        {predictions.map((pred, i) => {
          const isPositive = pred.changePercent >= 0;
          return (
            <motion.div
              key={pred.timeFrame}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-4 flex flex-col items-center gap-2"
            >
              <span className="text-xs font-mono text-muted-foreground">{pred.label}</span>
              <span className="text-lg font-mono font-bold text-foreground">
                ${pred.predictedPrice < 1 ? pred.predictedPrice.toFixed(6) : pred.predictedPrice.toFixed(2)}
              </span>
              <span
                className={`text-sm font-mono font-semibold ${
                  isPositive ? "text-gain" : "text-loss"
                }`}
              >
                {isPositive ? "+" : ""}
                {pred.changePercent.toFixed(2)}%
              </span>
              <SignalBadge signal={pred.signal} />
              <div className="w-full mt-1">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-0.5">
                  <span>Confidence</span>
                  <span>{pred.confidence.toFixed(0)}%</span>
                </div>
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.confidence}%` }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                    className="h-full rounded-full bg-accent"
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
