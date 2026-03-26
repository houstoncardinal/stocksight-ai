import { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
} from "recharts";
import { StockDataPoint, AnalysisResult } from "@/lib/algorithms";
import { CandlestickChartIcon, LineChart as LineChartIcon } from "lucide-react";

interface PriceChartProps {
  data: StockDataPoint[];
  analysis: AnalysisResult;
}

type ChartMode = "line" | "candle";
type Overlay = "sma" | "ema" | "bollinger" | "vwap" | "none";
type SubChart = "volume" | "rsi" | "macd" | "stoch" | "adx" | "wr";

export default function PriceChart({ data, analysis }: PriceChartProps) {
  const [overlay, setOverlay] = useState<Overlay>("bollinger");
  const [subChart, setSubChart] = useState<SubChart>("volume");
  const [chartMode, setChartMode] = useState<ChartMode>("line");

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
    { key: "none", label: "None" },
    { key: "sma", label: "SMA" },
    { key: "ema", label: "EMA" },
    { key: "bollinger", label: "BB" },
    { key: "vwap", label: "VWAP" },
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
    backgroundColor: "hsl(225,22%,8%)",
    border: "1px solid hsl(225,15%,18%)",
    borderRadius: 8,
    fontSize: 11,
    fontFamily: "JetBrains Mono",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
  };

  const gridStroke = "hsl(225,15%,12%)";
  const tickStyle = { fontSize: 10, fill: "hsl(220,15%,40%)" };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-card relative rounded-xl overflow-hidden"
    >
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-1">
          {/* Chart mode toggle */}
          <div className="flex items-center bg-secondary/50 rounded-md p-0.5 mr-3">
            <button
              onClick={() => setChartMode("line")}
              className={`p-1.5 rounded transition-colors ${chartMode === "line" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode("candle")}
              className={`p-1.5 rounded transition-colors ${chartMode === "candle" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
            >
              <CandlestickIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground mr-2 font-mono tracking-wider uppercase">Overlay</span>
          {overlayBtns.map((b) => (
            <button
              key={b.key}
              onClick={() => setOverlay(b.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                overlay === b.key
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground mr-2 font-mono tracking-wider uppercase">Sub</span>
          {subBtns.map((b) => (
            <button
              key={b.key}
              onClick={() => setSubChart(b.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                subChart === b.key
                  ? "bg-accent/15 text-accent font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

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
                <Bar dataKey="candleBody" fill="transparent" barSize={6} shape={(props: any) => {
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
