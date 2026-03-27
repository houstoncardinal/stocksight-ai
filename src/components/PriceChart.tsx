import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Scatter,
  Cell,
} from "recharts";
import { StockDataPoint, AnalysisResult } from "@/lib/algorithms";
import { CandlestickChartIcon, LineChart as LineChartIcon, History, TrendingUp, BarChart3, Activity, Layers, Clock } from "lucide-react";
import { generateBacktest, BacktestResult } from "@/lib/predictions";

interface PriceChartProps {
  data: StockDataPoint[];
  analysis: AnalysisResult;
  enableBacktest?: boolean;
}

type ChartMode = "line" | "candle" | "area" | "heikin";
type Overlay = "sma" | "ema" | "bollinger" | "vwap" | "ichimoku" | "none";
type TimeFrame = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL";

interface CandleShapeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: { isGreen: boolean; high: number; low: number };
  background?: { y: number; height: number };
}
type SubChart = "volume" | "rsi" | "macd" | "stoch" | "adx" | "wr";

export default function PriceChart({ data, analysis, enableBacktest = false }: PriceChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [overlay, setOverlay] = useState<Overlay>("bollinger");
  const [subChart, setSubChart] = useState<SubChart>("volume");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("3M");
  const [showBacktest, setShowBacktest] = useState(false);

  // Timeframe filtering
  const filteredData = useMemo(() => {
    if (!data.length) return [];
    const now = new Date(data[data.length - 1].date);
    let lookbackDays = 90; // 3M default
    
    switch (timeFrame) {
      case "1D": lookbackDays = 1; break;
      case "1W": lookbackDays = 7; break;
      case "1M": lookbackDays = 30; break;
      case "3M": lookbackDays = 90; break;
      case "6M": lookbackDays = 180; break;
      case "1Y": lookbackDays = 365; break;
      case "ALL": return data;
    }
    
    const cutoff = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    return data.filter(d => new Date(d.date) >= cutoff);
  }, [data, timeFrame]);

  // Generate backtest data
  const backtestResult = useMemo(() => {
    if (!enableBacktest || data.length < 60) return null;
    return generateBacktest(data, analysis);
  }, [data, analysis, enableBacktest]);

  // Map backtest predictions to chart data
  const backtestData = useMemo(() => {
    if (!backtestResult) return [];
    return backtestResult.predictions.map(p => {
      const dataPoint = data.find(d => d.date === p.date);
      if (!dataPoint) return null;
      const index = data.findIndex(d => d.date === p.date);
      return {
        date: p.date,
        predicted: p.predictedPrice,
        actual: p.actualPrice,
        x: index,
        y: p.predictedPrice,
      };
    }).filter(Boolean);
  }, [backtestResult, data]);

  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      date: d.date,
      close: d.close,
      open: d.open,
      high: d.high,
      low: d.low,
      volume: d.volume,
      sma20: isNaN(analysis.sma20[i]) ? undefined : analysis.sma20[i],
      sma50: isNaN(analysis.sma50[i]) ? undefined : analysis.sma50[i],
      sma200: isNaN(analysis.sma200[i]) ? undefined : analysis.sma200[i],
      ema12: isNaN(analysis.ema12[i]) ? undefined : analysis.ema12[i],
      ema26: isNaN(analysis.ema26[i]) ? undefined : analysis.ema26[i],
      rsi: isNaN(analysis.rsi[i]) ? undefined : analysis.rsi[i],
      macd: isNaN(analysis.macd[i]) ? undefined : analysis.macd[i],
      macdSignal: isNaN(analysis.macdSignal[i]) ? undefined : analysis.macdSignal[i],
      macdHist: isNaN(analysis.macdHistogram[i]) ? undefined : analysis.macdHistogram[i],
      bbUpper: isNaN(analysis.bollingerUpper[i]) ? undefined : analysis.bollingerUpper[i],
      bbMiddle: isNaN(analysis.bollingerMiddle[i]) ? undefined : analysis.bollingerMiddle[i],
      bbLower: isNaN(analysis.bollingerLower[i]) ? undefined : analysis.bollingerLower[i],
      stochK: isNaN(analysis.stochK[i]) ? undefined : analysis.stochK[i],
      stochD: isNaN(analysis.stochD[i]) ? undefined : analysis.stochD[i],
      vwap: isNaN(analysis.vwap[i]) ? undefined : analysis.vwap[i],
      adx: isNaN(analysis.adx[i]) ? undefined : analysis.adx[i],
      wr: isNaN(analysis.williamsR[i]) ? undefined : analysis.williamsR[i],
      tenkan: isNaN(analysis.tenkan[i]) ? undefined : analysis.tenkan[i],
      kijun: isNaN(analysis.kijun[i]) ? undefined : analysis.kijun[i],
      senkouA: isNaN(analysis.senkouA[i]) ? undefined : analysis.senkouA[i],
      senkouB: isNaN(analysis.senkouB[i]) ? undefined : analysis.senkouB[i],
      ema9: isNaN(analysis.ema9[i]) ? undefined : analysis.ema9[i],
      ema21: isNaN(analysis.ema21[i]) ? undefined : analysis.ema21[i],
      // Candlestick helpers
      candleBody: d.close >= d.open ? [d.open, d.close] : [d.close, d.open],
      isGreen: d.close >= d.open,
    }));
  }, [data, analysis]);

  const displayData = chartData.length > 200 ? chartData.slice(-200) : chartData;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatPrice = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    if (v >= 1) return `$${v.toFixed(2)}`;
    return `$${v.toFixed(6)}`;
  };

  const overlayBtns: { key: Overlay; label: string }[] = [
    { key: "none",      label: "None"     },
    { key: "sma",       label: "SMA"      },
    { key: "ema",       label: "EMA"      },
    { key: "bollinger", label: "BB"       },
    { key: "vwap",      label: "VWAP"     },
    { key: "ichimoku",  label: "Ichimoku" },
  ];

  const subBtns: { key: SubChart; label: string }[] = [
    { key: "volume", label: "VOL" },
    { key: "rsi", label: "RSI" },
    { key: "macd", label: "MACD" },
    { key: "stoch", label: "STOCH" },
    { key: "adx", label: "ADX" },
    { key: "wr", label: "W%R" },
  ];

  const tooltipStyle = {
    backgroundColor: isDark ? "hsl(225,22%,9%)" : "hsl(0,0%,100%)",
    border: isDark ? "1px solid hsl(225,15%,18%)" : "1px solid hsl(220,13%,88%)",
    borderRadius: 10,
    fontSize: 11,
    fontFamily: "JetBrains Mono",
    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 4px 24px rgba(0,0,0,0.10)",
    color: isDark ? "hsl(210,20%,90%)" : "hsl(222,47%,11%)",
  };

  const gridStroke = isDark ? "hsl(225,15%,13%)" : "hsl(220,13%,91%)";
  const tickStyle = { fontSize: 10, fill: isDark ? "hsl(220,15%,40%)" : "hsl(215,16%,55%)" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-card relative rounded-2xl overflow-hidden"
    >
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Chart mode toggle */}
          <div className="flex items-center bg-secondary rounded-xl p-0.5 mr-1">
            <button
              onClick={() => setChartMode("line")}
              title="Line chart"
              className={`p-1.5 rounded-lg transition-all ${chartMode === "line" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode("candle")}
              title="Candlestick chart"
              className={`p-1.5 rounded-lg transition-all ${chartMode === "candle" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <CandlestickChartIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="hidden sm:flex items-center bg-secondary rounded-lg p-0.5 mr-2">
            {(["1D", "1W", "1M", "3M", "6M", "1Y", "ALL"] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFrame(tf)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  timeFrame === tf
                    ? "bg-card shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mr-0.5">Overlay</span>
          {overlayBtns.map((b) => (
            <button
              key={b.key}
              onClick={() => setOverlay(b.key)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                overlay === b.key
                  ? "bg-primary/12 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mr-0.5">Sub</span>
          {subBtns.map((b) => (
            <button
              key={b.key}
              onClick={() => setSubChart(b.key)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                subChart === b.key
                  ? "bg-accent/12 text-accent border border-accent/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              {b.label}
            </button>
          ))}
          
          {/* Backtest Toggle */}
          {enableBacktest && backtestResult && (
            <button
              onClick={() => setShowBacktest(!showBacktest)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ml-2 ${
                showBacktest
                  ? "bg-ai/12 text-ai border border-ai/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <History className="w-3 h-3" />
              Backtest
            </button>
          )}
        </div>
      </div>

      {/* Backtest Stats Bar */}
      {showBacktest && backtestResult && (
        <div className="px-4 py-2 border-b border-border/60 bg-ai/[0.03] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-ai" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-ai">Model Accuracy</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">MAPE:</span>
              <span className={`font-bold ${backtestResult.accuracy.mape < 10 ? "text-gain" : backtestResult.accuracy.mape < 20 ? "text-warn" : "text-loss"}`}>
                {backtestResult.accuracy.mape.toFixed(1)}%
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">Directional:</span>
              <span className={`font-bold ${backtestResult.accuracy.directional > 50 ? "text-gain" : "text-loss"}`}>
                {backtestResult.accuracy.directional.toFixed(0)}%
              </span>
            </span>
            <span className="flex items-center gap-1">
              <span className="text-muted-foreground">RMSE:</span>
              <span className="font-bold text-foreground">${backtestResult.accuracy.rmse.toFixed(2)}</span>
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground ml-auto">
            {backtestResult.predictions.length} predictions over 6 months
          </span>
        </div>
      )}

      {/* Main Chart */}
      <div className="px-2 pt-3">
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(200,100%,55%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(200,100%,55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tickFormatter={formatPrice} tick={tickStyle} axisLine={false} tickLine={false} width={65} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => v} formatter={(value: number) => [formatPrice(value), ""]} />

            {chartMode === "line" && (
              <Area
                type="monotone"
                dataKey="close"
                fill="url(#priceGradient)"
                stroke="hsl(200,100%,55%)"
                strokeWidth={2}
                dot={false}
                name="Price"
              />
            )}

            {chartMode === "candle" && (
              <>
                <Bar dataKey="candleBody" fill="transparent" barSize={6} shape={(props: CandleShapeProps) => {
                  const { x, y, width, height, payload } = props;
                  const color = payload.isGreen ? "hsl(145,80%,48%)" : "hsl(0,85%,55%)";
                  const wickY = payload.high;
                  const wickLow = payload.low;
                  return (
                    <g>
                      <line x1={x + width / 2} x2={x + width / 2} y1={props.background?.y} y2={props.background?.y + props.background?.height} stroke={color} strokeWidth={1} opacity={0.5} />
                      <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={color} rx={1} />
                    </g>
                  );
                }} />
              </>
            )}

            {overlay === "sma" && (
              <>
                <Line type="monotone" dataKey="sma20" stroke="hsl(38,95%,55%)" strokeWidth={1.5} dot={false} name="SMA 20" />
                <Line type="monotone" dataKey="sma50" stroke="hsl(280,80%,60%)" strokeWidth={1.5} dot={false} name="SMA 50" />
                <Line type="monotone" dataKey="sma200" stroke="hsl(0,85%,55%)" strokeWidth={1} dot={false} strokeDasharray="6 3" name="SMA 200" />
              </>
            )}
            {overlay === "ema" && (
              <>
                <Line type="monotone" dataKey="ema12" stroke="hsl(38,95%,55%)" strokeWidth={1.5} dot={false} name="EMA 12" />
                <Line type="monotone" dataKey="ema26" stroke="hsl(280,80%,60%)" strokeWidth={1.5} dot={false} name="EMA 26" />
              </>
            )}
            {overlay === "bollinger" && (
              <>
                <Line type="monotone" dataKey="bbUpper" stroke="hsl(0,85%,55%)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="BB Upper" />
                <Line type="monotone" dataKey="bbMiddle" stroke="hsl(38,95%,55%)" strokeWidth={1} dot={false} name="BB Mid" />
                <Line type="monotone" dataKey="bbLower" stroke="hsl(145,80%,48%)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="BB Lower" />
              </>
            )}
            {overlay === "vwap" && (
              <Line type="monotone" dataKey="vwap" stroke="hsl(280,80%,60%)" strokeWidth={2} dot={false} name="VWAP" />
            )}
            {overlay === "ichimoku" && (
              <>
                <Line type="monotone" dataKey="tenkan"  stroke="hsl(38,96%,56%)"   strokeWidth={1.5} dot={false} name="Tenkan" />
                <Line type="monotone" dataKey="kijun"   stroke="hsl(0,86%,57%)"    strokeWidth={1.5} dot={false} name="Kijun" />
                <Line type="monotone" dataKey="senkouA" stroke="hsl(145,82%,50%)"  strokeWidth={1}   dot={false} strokeDasharray="3 2" name="Senkou A" />
                <Line type="monotone" dataKey="senkouB" stroke="hsl(0,86%,57%)"    strokeWidth={1}   dot={false} strokeDasharray="3 2" name="Senkou B" />
              </>
            )}

            {/* Backtest predictions overlay */}
            {showBacktest && backtestData.length > 0 && (
              <>
                <Scatter
                  data={backtestData}
                  dataKey="y"
                  fill="hsl(var(--ai-accent))"
                  fillOpacity={0.8}
                  shape="circle"
                  r={4}
                  name="Predicted"
                />
                <Line
                  type="monotone"
                  data={backtestData}
                  dataKey="y"
                  stroke="hsl(var(--ai-accent))"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={false}
                  name="Model Prediction"
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub Chart */}
      <div className="px-2 pb-2 border-t border-border">
        <ResponsiveContainer width="100%" height={130}>
          {subChart === "volume" ? (
            <ComposedChart data={displayData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} width={65} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <Bar dataKey="volume" fill="hsl(200,100%,55%)" fillOpacity={0.25} radius={[2, 2, 0, 0]} name="Volume" />
            </ComposedChart>
          ) : subChart === "rsi" ? (
            <ComposedChart data={displayData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} width={65} />
              <ReferenceLine y={70} stroke="hsl(0,85%,55%)" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "70", position: "right", fill: "hsl(0,85%,55%)", fontSize: 9 }} />
              <ReferenceLine y={30} stroke="hsl(145,80%,48%)" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "30", position: "right", fill: "hsl(145,80%,48%)", fontSize: 9 }} />
              <Line type="monotone" dataKey="rsi" stroke="hsl(280,80%,60%)" strokeWidth={1.5} dot={false} name="RSI" />
            </ComposedChart>
          ) : subChart === "macd" ? (
            <ComposedChart data={displayData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} width={65} />
              <ReferenceLine y={0} stroke="hsl(220,15%,25%)" />
              <Bar dataKey="macdHist" fill="hsl(200,100%,55%)" fillOpacity={0.3} radius={[1, 1, 0, 0]} name="Histogram" />
              <Line type="monotone" dataKey="macd" stroke="hsl(200,100%,55%)" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="macdSignal" stroke="hsl(0,85%,55%)" strokeWidth={1.5} dot={false} name="Signal" />
            </ComposedChart>
          ) : subChart === "stoch" ? (
            <ComposedChart data={displayData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} width={65} />
              <ReferenceLine y={80} stroke="hsl(0,85%,55%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={20} stroke="hsl(145,80%,48%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="stochK" stroke="hsl(200,100%,55%)" strokeWidth={1.5} dot={false} name="%K" />
              <Line type="monotone" dataKey="stochD" stroke="hsl(38,95%,55%)" strokeWidth={1.5} dot={false} name="%D" />
            </ComposedChart>
          ) : subChart === "adx" ? (
            <ComposedChart data={displayData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} width={65} />
              <ReferenceLine y={25} stroke="hsl(38,95%,55%)" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: "25", position: "right", fill: "hsl(38,95%,55%)", fontSize: 9 }} />
              <Line type="monotone" dataKey="adx" stroke="hsl(160,100%,42%)" strokeWidth={1.5} dot={false} name="ADX" />
            </ComposedChart>
          ) : (
            <ComposedChart data={displayData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[-100, 0]} tick={{ fontSize: 9, fill: "hsl(220,15%,40%)" }} axisLine={false} tickLine={false} width={65} />
              <ReferenceLine y={-20} stroke="hsl(0,85%,55%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={-80} stroke="hsl(145,80%,48%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="wr" stroke="hsl(38,95%,55%)" strokeWidth={1.5} dot={false} name="Williams %R" />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
