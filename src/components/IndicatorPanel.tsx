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
  description: string;
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
      description: rsiVal < 30 ? "Oversold" : rsiVal > 70 ? "Overbought" : "Neutral zone",
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
      description: macdVal > macdSig ? "Above signal line" : "Below signal line",
    });
  }

  // SMA 20
  const sma20 = analysis.sma20[len];
  if (!isNaN(sma20)) {
    indicators.push({
      name: "SMA 20",
      value: price < 1 ? `$${sma20.toFixed(6)}` : `$${sma20.toFixed(2)}`,
      signal: price > sma20 ? "bullish" : "bearish",
      description: price > sma20 ? "Price above" : "Price below",
    });
  }

  // SMA 50
  const sma50 = analysis.sma50[len];
  if (!isNaN(sma50)) {
    indicators.push({
      name: "SMA 50",
      value: price < 1 ? `$${sma50.toFixed(6)}` : `$${sma50.toFixed(2)}`,
      signal: price > sma50 ? "bullish" : "bearish",
      description: price > sma50 ? "Price above" : "Price below",
    });
  }

  // SMA 200
  const sma200 = analysis.sma200[len];
  if (!isNaN(sma200)) {
    indicators.push({
      name: "SMA 200",
      value: price < 1 ? `$${sma200.toFixed(6)}` : `$${sma200.toFixed(2)}`,
      signal: price > sma200 ? "bullish" : "bearish",
      description: price > sma200 ? "Long-term bullish" : "Long-term bearish",
    });
  }

  // Bollinger
  const bbU = analysis.bollingerUpper[len];
  const bbL = analysis.bollingerLower[len];
  if (!isNaN(bbU) && !isNaN(bbL)) {
    indicators.push({
      name: "Bollinger Bands",
      value: `${bbL.toFixed(0)} — ${bbU.toFixed(0)}`,
      signal: price <= bbL ? "bullish" : price >= bbU ? "bearish" : "neutral",
      description: price <= bbL ? "Near lower band" : price >= bbU ? "Near upper band" : "Within bands",
    });
  }

  // Stochastic
  const stK = analysis.stochK[len];
  if (!isNaN(stK)) {
    indicators.push({
      name: "Stochastic %K",
      value: stK.toFixed(1),
      signal: stK < 20 ? "bullish" : stK > 80 ? "bearish" : "neutral",
      description: stK < 20 ? "Oversold" : stK > 80 ? "Overbought" : "Neutral",
    });
  }

  // ATR
  const atrVal = analysis.atr[len];
  if (!isNaN(atrVal)) {
    indicators.push({
      name: "ATR (14)",
      value: atrVal.toFixed(2),
      signal: "neutral",
      description: "Volatility measure",
    });
  }

  // ADX
  const adxVal = analysis.adx[len];
  if (!isNaN(adxVal)) {
    indicators.push({
      name: "ADX",
      value: adxVal.toFixed(1),
      signal: adxVal > 25 ? "bullish" : "neutral",
      description: adxVal > 25 ? "Strong trend" : "Weak trend",
    });
  }

  // Williams %R
  const wrVal = analysis.williamsR[len];
  if (!isNaN(wrVal)) {
    indicators.push({
      name: "Williams %R",
      value: wrVal.toFixed(1),
      signal: wrVal < -80 ? "bullish" : wrVal > -20 ? "bearish" : "neutral",
      description: wrVal < -80 ? "Oversold" : wrVal > -20 ? "Overbought" : "Neutral",
    });
  }

  // VWAP
  const vwapVal = analysis.vwap[len];
  if (!isNaN(vwapVal)) {
    indicators.push({
      name: "VWAP",
      value: price < 1 ? `$${vwapVal.toFixed(6)}` : `$${vwapVal.toFixed(2)}`,
      signal: price > vwapVal ? "bullish" : "bearish",
      description: price > vwapVal ? "Above VWAP" : "Below VWAP",
    });
  }

  const signalColor = (s: Indicator["signal"]) =>
    s === "bullish" ? "text-gain" : s === "bearish" ? "text-loss" : "text-warn";

  const signalDot = (s: Indicator["signal"]) =>
    s === "bullish" ? "bg-gain" : s === "bearish" ? "bg-loss" : "bg-warn";

  const bullish = indicators.filter((i) => i.signal === "bullish").length;
  const bearish = indicators.filter((i) => i.signal === "bearish").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card relative rounded-xl overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
          Technical Indicators
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-gain">{bullish} Bullish</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-loss">{bearish} Bearish</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-warn">{indicators.length - bullish - bearish} Neutral</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border/50">
        {indicators.map((ind, i) => (
          <motion.div
            key={ind.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.04 }}
            className="bg-card p-4 flex flex-col gap-1.5 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${signalDot(ind.signal)} ticker-pulse`} />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{ind.name}</span>
            </div>
            <span className="text-sm font-mono font-bold text-foreground">{ind.value}</span>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-semibold ${signalColor(ind.signal)}`}>
                {ind.signal}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">{ind.description}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
