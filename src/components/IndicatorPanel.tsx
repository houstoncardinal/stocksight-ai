import { motion } from "framer-motion";
import { AnalysisResult, StockDataPoint } from "@/lib/algorithms";

interface IndicatorPanelProps {
  data: StockDataPoint[];
  analysis: AnalysisResult;
}

interface Indicator {
  name: string;
  value: string;
  signal: "bullish" | "bearish" | "neutral";
}

export default function IndicatorPanel({ data, analysis }: IndicatorPanelProps) {
  const len = data.length - 1;
  const price = data[len].close;

  const indicators: Indicator[] = [];

  // RSI
  const rsiVal = analysis.rsi[len];
  if (!isNaN(rsiVal)) {
    indicators.push({
      name: "RSI (14)",
      value: rsiVal.toFixed(1),
      signal: rsiVal < 30 ? "bullish" : rsiVal > 70 ? "bearish" : "neutral",
    });
  }

  // MACD
  const macdVal = analysis.macd[len];
  const macdSig = analysis.macdSignal[len];
  if (!isNaN(macdVal) && !isNaN(macdSig)) {
    indicators.push({
      name: "MACD",
      value: macdVal.toFixed(2),
      signal: macdVal > macdSig ? "bullish" : "bearish",
    });
  }

  // SMA 20
  const sma20 = analysis.sma20[len];
  if (!isNaN(sma20)) {
    indicators.push({
      name: "SMA 20",
      value: `$${sma20.toFixed(2)}`,
      signal: price > sma20 ? "bullish" : "bearish",
    });
  }

  // SMA 50
  const sma50 = analysis.sma50[len];
  if (!isNaN(sma50)) {
    indicators.push({
      name: "SMA 50",
      value: `$${sma50.toFixed(2)}`,
      signal: price > sma50 ? "bullish" : "bearish",
    });
  }

  // Bollinger
  const bbU = analysis.bollingerUpper[len];
  const bbL = analysis.bollingerLower[len];
  if (!isNaN(bbU) && !isNaN(bbL)) {
    indicators.push({
      name: "Bollinger",
      value: `${bbL.toFixed(0)} — ${bbU.toFixed(0)}`,
      signal: price <= bbL ? "bullish" : price >= bbU ? "bearish" : "neutral",
    });
  }

  // Stochastic
  const stK = analysis.stochK[len];
  if (!isNaN(stK)) {
    indicators.push({
      name: "Stoch %K",
      value: stK.toFixed(1),
      signal: stK < 20 ? "bullish" : stK > 80 ? "bearish" : "neutral",
    });
  }

  // ATR
  const atrVal = analysis.atr[len];
  if (!isNaN(atrVal)) {
    indicators.push({
      name: "ATR (14)",
      value: atrVal.toFixed(2),
      signal: "neutral",
    });
  }

  const signalColor = (s: Indicator["signal"]) =>
    s === "bullish" ? "text-gain" : s === "bearish" ? "text-loss" : "text-warn";

  const signalDot = (s: Indicator["signal"]) =>
    s === "bullish" ? "bg-gain" : s === "bearish" ? "bg-loss" : "bg-warn";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="terminal-border rounded-lg"
    >
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
          Technical Indicators
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
        {indicators.map((ind, i) => (
          <motion.div
            key={ind.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="bg-card p-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${signalDot(ind.signal)}`} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{ind.name}</span>
            </div>
            <span className="text-sm font-mono font-semibold text-foreground">{ind.value}</span>
            <span className={`text-[10px] font-mono uppercase ${signalColor(ind.signal)}`}>
              {ind.signal}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
