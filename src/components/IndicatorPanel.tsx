import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnalysisResult, StockDataPoint } from "@/lib/algorithms";

interface IndicatorPanelProps {
  data: StockDataPoint[];
  analysis: AnalysisResult;
}

type Category = "All" | "Momentum" | "Trend" | "Volatility" | "Volume" | "Ichimoku";

interface Indicator {
  name: string;
  value: string;
  signal: "bullish" | "bearish" | "neutral";
  description: string;
  fillPct: number;
  lowThreshold?: number;
  highThreshold?: number;
  category: Category;
}

function toPct(v: number, min: number, max: number) {
  return Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
}

function Bar({ fillPct, signal, lowTh, highTh }: {
  fillPct: number; signal: Indicator["signal"]; lowTh?: number; highTh?: number;
}) {
  const color = signal === "bullish" ? "bg-gain" : signal === "bearish" ? "bg-loss" : "bg-warn";
  return (
    <div className="relative h-1 rounded-full bg-secondary overflow-hidden mt-2">
      {lowTh  !== undefined && <div className="absolute top-0 bottom-0 w-px bg-gain/40 z-10" style={{ left: `${lowTh}%` }} />}
      {highTh !== undefined && <div className="absolute top-0 bottom-0 w-px bg-loss/40 z-10" style={{ left: `${highTh}%` }} />}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${fillPct}%` }}
        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

const SIGNAL_STYLE = {
  bullish: { dot: "bg-gain",    text: "text-gain",    border: "border-l-2 border-l-gain/50",    bg: "" },
  bearish: { dot: "bg-loss",    text: "text-loss",    border: "border-l-2 border-l-loss/50",    bg: "" },
  neutral: { dot: "bg-warn",    text: "text-warn",    border: "border-l-2 border-l-warn/50",    bg: "" },
};

const TABS: Category[] = ["All", "Momentum", "Trend", "Volatility", "Volume", "Ichimoku"];

export default function IndicatorPanel({ data, analysis }: IndicatorPanelProps) {
  const [activeTab, setActiveTab] = useState<Category>("All");
  const len = data.length - 1;
  const price = data[len].close;

  const indicators: Indicator[] = [];

  // ── Momentum ──────────────────────────────────────────

  const rsiV = analysis.rsi[len];
  if (!isNaN(rsiV)) indicators.push({
    name: "RSI (14)", value: rsiV.toFixed(1), category: "Momentum",
    signal: rsiV < 30 ? "bullish" : rsiV > 70 ? "bearish" : "neutral",
    description: rsiV < 30 ? "Oversold" : rsiV > 70 ? "Overbought" : "Neutral",
    fillPct: rsiV, lowThreshold: 30, highThreshold: 70,
  });

  const stK = analysis.stochK[len];
  if (!isNaN(stK)) indicators.push({
    name: "Stoch %K", value: stK.toFixed(1), category: "Momentum",
    signal: stK < 20 ? "bullish" : stK > 80 ? "bearish" : "neutral",
    description: stK < 20 ? "Oversold" : stK > 80 ? "Overbought" : "Neutral",
    fillPct: stK, lowThreshold: 20, highThreshold: 80,
  });

  const cciV = analysis.cci[len];
  if (!isNaN(cciV)) indicators.push({
    name: "CCI (14)", value: cciV.toFixed(0), category: "Momentum",
    signal: cciV < -100 ? "bullish" : cciV > 100 ? "bearish" : "neutral",
    description: cciV < -100 ? "Oversold" : cciV > 100 ? "Overbought" : `${cciV.toFixed(0)} neutral`,
    fillPct: toPct(cciV, -300, 300), lowThreshold: toPct(-100, -300, 300), highThreshold: toPct(100, -300, 300),
  });

  const mfiV = analysis.mfi[len];
  if (!isNaN(mfiV)) indicators.push({
    name: "MFI (14)", value: mfiV.toFixed(1), category: "Momentum",
    signal: mfiV < 20 ? "bullish" : mfiV > 80 ? "bearish" : "neutral",
    description: mfiV < 20 ? "Money outflow" : mfiV > 80 ? "Money inflow" : "Balanced",
    fillPct: mfiV, lowThreshold: 20, highThreshold: 80,
  });

  const wrV = analysis.williamsR[len];
  if (!isNaN(wrV)) indicators.push({
    name: "Williams %R", value: wrV.toFixed(1), category: "Momentum",
    signal: wrV < -80 ? "bullish" : wrV > -20 ? "bearish" : "neutral",
    description: wrV < -80 ? "Oversold" : wrV > -20 ? "Overbought" : "Neutral",
    fillPct: toPct(wrV, -100, 0), lowThreshold: 20, highThreshold: 80,
  });

  const rocV = analysis.roc[len];
  if (!isNaN(rocV)) indicators.push({
    name: "ROC (10)", value: `${rocV.toFixed(2)}%`, category: "Momentum",
    signal: rocV > 0 ? "bullish" : rocV < 0 ? "bearish" : "neutral",
    description: rocV > 5 ? "Strong momentum" : rocV > 0 ? "Positive momentum" : rocV > -5 ? "Weakening" : "Negative momentum",
    fillPct: toPct(rocV, -20, 20), lowThreshold: 50,
  });

  // ── Trend ─────────────────────────────────────────────

  const macdV = analysis.macd[len];
  const macdS = analysis.macdSignal[len];
  if (!isNaN(macdV) && !isNaN(macdS)) indicators.push({
    name: "MACD", value: macdV.toFixed(3), category: "Trend",
    signal: macdV > macdS ? "bullish" : "bearish",
    description: macdV > macdS ? `+${(macdV - macdS).toFixed(3)} above signal` : `${(macdV - macdS).toFixed(3)} below signal`,
    fillPct: toPct(macdV, -Math.abs(macdV) * 3, Math.abs(macdV) * 3), lowThreshold: 50,
  });

  const sma20 = analysis.sma20[len];
  if (!isNaN(sma20)) {
    const d = ((price - sma20) / sma20) * 100;
    indicators.push({
      name: "SMA 20", value: price < 1 ? `$${sma20.toFixed(6)}` : `$${sma20.toFixed(2)}`, category: "Trend",
      signal: price > sma20 ? "bullish" : "bearish",
      description: `${d >= 0 ? "+" : ""}${d.toFixed(2)}% vs price`,
      fillPct: toPct(d, -20, 20), lowThreshold: 50,
    });
  }

  const sma50 = analysis.sma50[len];
  if (!isNaN(sma50)) {
    const d = ((price - sma50) / sma50) * 100;
    indicators.push({
      name: "SMA 50", value: price < 1 ? `$${sma50.toFixed(6)}` : `$${sma50.toFixed(2)}`, category: "Trend",
      signal: price > sma50 ? "bullish" : "bearish",
      description: `${d >= 0 ? "+" : ""}${d.toFixed(2)}% vs price`,
      fillPct: toPct(d, -25, 25), lowThreshold: 50,
    });
  }

  const sma200 = analysis.sma200[len];
  if (!isNaN(sma200)) {
    const d = ((price - sma200) / sma200) * 100;
    indicators.push({
      name: "SMA 200", value: price < 1 ? `$${sma200.toFixed(6)}` : `$${sma200.toFixed(2)}`, category: "Trend",
      signal: price > sma200 ? "bullish" : "bearish",
      description: price > sma200 ? `Long-term bull (+${d.toFixed(1)}%)` : `Long-term bear (${d.toFixed(1)}%)`,
      fillPct: toPct(d, -30, 30), lowThreshold: 50,
    });
  }

  const adxV = analysis.adx[len];
  if (!isNaN(adxV)) indicators.push({
    name: "ADX", value: adxV.toFixed(1), category: "Trend",
    signal: adxV > 25 ? "bullish" : "neutral",
    description: adxV > 50 ? "Very strong trend" : adxV > 25 ? "Strong trend" : "Weak trend",
    fillPct: adxV, lowThreshold: 25, highThreshold: 50,
  });

  const arU = analysis.aroonUp[len];
  const arD = analysis.aroonDown[len];
  if (!isNaN(arU) && !isNaN(arD)) indicators.push({
    name: "Aroon Up", value: `${arU.toFixed(0)} / ${arD.toFixed(0)}`, category: "Trend",
    signal: arU > arD && arU > 70 ? "bullish" : arD > arU && arD > 70 ? "bearish" : "neutral",
    description: arU > arD ? `Up dominant (+${(arU - arD).toFixed(0)})` : `Down dominant (+${(arD - arU).toFixed(0)})`,
    fillPct: arU, lowThreshold: 30, highThreshold: 70,
  });

  // ── Volatility ────────────────────────────────────────

  const bbU = analysis.bollingerUpper[len];
  const bbL = analysis.bollingerLower[len];
  if (!isNaN(bbU) && !isNaN(bbL)) {
    const bbRange = bbU - bbL;
    const bbPos = bbRange > 0 ? ((price - bbL) / bbRange) * 100 : 50;
    indicators.push({
      name: "Bollinger Bands", value: `${bbPos.toFixed(0)}% width`, category: "Volatility",
      signal: price <= bbL ? "bullish" : price >= bbU ? "bearish" : "neutral",
      description: price <= bbL ? "At lower band" : price >= bbU ? "At upper band" : `${bbPos.toFixed(0)}% in bands`,
      fillPct: bbPos, lowThreshold: 20, highThreshold: 80,
    });
  }

  const atrV = analysis.atr[len];
  if (!isNaN(atrV)) {
    const atrPct = (atrV / price) * 100;
    indicators.push({
      name: "ATR (14)", value: atrV.toFixed(2), category: "Volatility",
      signal: "neutral",
      description: `${atrPct.toFixed(2)}% of price — ${atrPct > 3 ? "high" : atrPct > 1.5 ? "moderate" : "low"} vol`,
      fillPct: Math.min(100, atrPct * 12),
    });
  }

  // ── Volume ────────────────────────────────────────────

  const vwapV = analysis.vwap[len];
  if (!isNaN(vwapV)) {
    const d = ((price - vwapV) / vwapV) * 100;
    indicators.push({
      name: "VWAP", value: price < 1 ? `$${vwapV.toFixed(6)}` : `$${vwapV.toFixed(2)}`, category: "Volume",
      signal: price > vwapV ? "bullish" : "bearish",
      description: `${d >= 0 ? "+" : ""}${d.toFixed(2)}% vs VWAP`,
      fillPct: toPct(d, -10, 10), lowThreshold: 50,
    });
  }

  const obvArr = analysis.obv;
  const obvLast = obvArr[len];
  const obvPrev = obvArr[Math.max(0, len - 10)];
  if (!isNaN(obvLast)) {
    const obvTrend = obvLast > obvPrev ? "bullish" : "bearish";
    const obvChange = obvPrev !== 0 ? ((obvLast - obvPrev) / Math.abs(obvPrev)) * 100 : 0;
    indicators.push({
      name: "OBV", value: obvLast >= 1e6 ? `${(obvLast / 1e6).toFixed(1)}M` : obvLast >= 1e3 ? `${(obvLast / 1e3).toFixed(1)}K` : obvLast.toFixed(0),
      category: "Volume", signal: obvTrend,
      description: `10-day: ${obvChange >= 0 ? "+" : ""}${obvChange.toFixed(1)}% ${obvTrend}`,
      fillPct: toPct(obvChange, -30, 30), lowThreshold: 50,
    });
  }

  // ── Ichimoku ──────────────────────────────────────────

  const tenkan = analysis.tenkan[len];
  const kijun  = analysis.kijun[len];
  if (!isNaN(tenkan) && !isNaN(kijun)) {
    indicators.push({
      name: "Tenkan / Kijun", value: `${tenkan.toFixed(2)} / ${kijun.toFixed(2)}`, category: "Ichimoku",
      signal: tenkan > kijun ? "bullish" : "bearish",
      description: tenkan > kijun ? "TK Bullish Cross" : "TK Bearish Cross",
      fillPct: toPct((tenkan - kijun) / kijun * 100, -10, 10), lowThreshold: 50,
    });
  }

  const senkA = analysis.senkouA[len];
  const senkB = analysis.senkouB[len];
  if (!isNaN(senkA) && !isNaN(senkB)) {
    const aboveCloud = price > Math.max(senkA, senkB);
    const belowCloud = price < Math.min(senkA, senkB);
    indicators.push({
      name: "Kumo Cloud", value: aboveCloud ? "Above" : belowCloud ? "Below" : "Inside", category: "Ichimoku",
      signal: aboveCloud ? "bullish" : belowCloud ? "bearish" : "neutral",
      description: aboveCloud ? "Price above cloud — bullish" : belowCloud ? "Price below cloud — bearish" : "Price in cloud — neutral",
      fillPct: aboveCloud ? 80 : belowCloud ? 20 : 50,
    });
  }

  const filtered = activeTab === "All" ? indicators : indicators.filter(i => i.category === activeTab);

  const bullCount = indicators.filter(i => i.signal === "bullish").length;
  const bearCount = indicators.filter(i => i.signal === "bearish").length;
  const neutCount = indicators.length - bullCount - bearCount;
  const total     = indicators.length || 1;

  const tabCounts = TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t] = t === "All" ? indicators.length : indicators.filter(i => i.category === t).length;
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="panel-card"
    >
      {/* Accent line */}
      <div className="card-accent-line" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Technical Indicators</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{indicators.length} indicators · {bullCount} bullish · {bearCount} bearish</p>
          </div>

          {/* Summary bar */}
          <div className="hidden sm:flex flex-col gap-1.5 min-w-[160px]">
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
              <span className="text-gain">{bullCount} Bull</span>
              <span className="text-warn">{neutCount} Neut</span>
              <span className="text-loss">{bearCount} Bear</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-secondary">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(bullCount / total) * 100}%` }}
                transition={{ duration: 0.8 }} className="h-full bg-gain" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${(neutCount / total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 }} className="h-full bg-warn" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${(bearCount / total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }} className="h-full bg-loss" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-px">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                activeTab === tab
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              {tab}
              <span className={`text-[9px] px-1 rounded ${activeTab === tab ? "text-primary/70" : "text-muted-foreground/60"}`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-border/40"
        >
          {filtered.map((ind, i) => {
            const s = SIGNAL_STYLE[ind.signal];
            return (
              <motion.div
                key={ind.name}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className={`bg-card hover:bg-secondary/25 transition-colors duration-150 p-4 flex flex-col gap-0.5 ${s.border}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {ind.category}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ticker-pulse`} />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground leading-tight">{ind.name}</span>
                <span className="text-base font-bold font-mono text-foreground leading-tight mt-0.5 truncate">{ind.value}</span>
                <Bar fillPct={ind.fillPct} signal={ind.signal} lowTh={ind.lowThreshold} highTh={ind.highThreshold} />
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${s.text}`}>{ind.signal}</span>
                  <span className="text-[9px] text-muted-foreground text-right leading-tight max-w-[110px] truncate">{ind.description}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Pivot Points footer */}
      <div className="px-5 py-4 border-t border-border/60 bg-secondary/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Pivot Points</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "R3", val: analysis.pivotR3, color: "text-loss" },
            { label: "R2", val: analysis.pivotR2, color: "text-loss" },
            { label: "R1", val: analysis.pivotR1, color: "text-loss/70" },
            { label: "PP", val: analysis.pivotPoint, color: "text-warn font-bold" },
            { label: "S1", val: analysis.pivotS1, color: "text-gain/70" },
            { label: "S2", val: analysis.pivotS2, color: "text-gain" },
            { label: "S3", val: analysis.pivotS3, color: "text-gain" },
          ].map(({ label, val, color }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border/60">
              <span className="text-[9px] font-bold text-muted-foreground">{label}</span>
              <span className={`text-xs font-bold font-mono ${color}`}>
                {val < 1 ? `$${val.toFixed(4)}` : `$${val.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
