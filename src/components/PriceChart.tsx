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
  Legend,
  ReferenceLine,
} from "recharts";
import { StockDataPoint, AnalysisResult } from "@/lib/algorithms";

interface PriceChartProps {
  data: StockDataPoint[];
  analysis: AnalysisResult;
}

type Overlay = "sma" | "ema" | "bollinger" | "none";
type SubChart = "volume" | "rsi" | "macd" | "stoch";

export default function PriceChart({ data, analysis }: PriceChartProps) {
  const [overlay, setOverlay] = useState<Overlay>("bollinger");
  const [subChart, setSubChart] = useState<SubChart>("volume");

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
    }));
  }, [data, analysis]);

  // Show last 200 points by default for readability
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
  ];

  const subBtns: { key: SubChart; label: string }[] = [
    { key: "volume", label: "VOL" },
    { key: "rsi", label: "RSI" },
    { key: "macd", label: "MACD" },
    { key: "stoch", label: "STOCH" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="terminal-border rounded-lg overflow-hidden"
    >
      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2 font-mono">OVERLAY</span>
          {overlayBtns.map((b) => (
            <button
              key={b.key}
              onClick={() => setOverlay(b.key)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                overlay === b.key
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2 font-mono">SUB</span>
          {subBtns.map((b) => (
            <button
              key={b.key}
              onClick={() => setSubChart(b.key)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                subChart === b.key
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chart */}
      <div className="px-2 pt-2">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: "hsl(215,15%,50%)" }} axisLine={false} />
            <YAxis
              domain={["auto", "auto"]}
              tickFormatter={formatPrice}
              tick={{ fontSize: 10, fill: "hsl(215,15%,50%)" }}
              axisLine={false}
              width={65}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220,18%,10%)",
                border: "1px solid hsl(220,15%,18%)",
                borderRadius: 6,
                fontSize: 12,
                fontFamily: "JetBrains Mono",
              }}
              labelFormatter={(v) => v}
              formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
            />
            <Area
              type="monotone"
              dataKey="close"
              fill="hsl(200,100%,55%)"
              fillOpacity={0.05}
              stroke="hsl(200,100%,55%)"
              strokeWidth={2}
              dot={false}
              name="Price"
            />
            {overlay === "sma" && (
              <>
                <Line type="monotone" dataKey="sma20" stroke="hsl(38,95%,55%)" strokeWidth={1.5} dot={false} name="SMA 20" />
                <Line type="monotone" dataKey="sma50" stroke="hsl(280,80%,60%)" strokeWidth={1.5} dot={false} name="SMA 50" />
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
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Sub Chart */}
      <div className="px-2 pb-2 border-t border-border">
        <ResponsiveContainer width="100%" height={120}>
          {subChart === "volume" ? (
            <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} width={65} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
              <Bar dataKey="volume" fill="hsl(200,100%,55%)" fillOpacity={0.3} name="Volume" />
            </ComposedChart>
          ) : subChart === "rsi" ? (
            <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} width={65} />
              <ReferenceLine y={70} stroke="hsl(0,85%,55%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={30} stroke="hsl(145,80%,48%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="rsi" stroke="hsl(280,80%,60%)" strokeWidth={1.5} dot={false} name="RSI" />
            </ComposedChart>
          ) : subChart === "macd" ? (
            <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} width={65} />
              <ReferenceLine y={0} stroke="hsl(215,15%,30%)" />
              <Bar dataKey="macdHist" fill="hsl(200,100%,55%)" fillOpacity={0.4} name="Histogram" />
              <Line type="monotone" dataKey="macd" stroke="hsl(200,100%,55%)" strokeWidth={1.5} dot={false} name="MACD" />
              <Line type="monotone" dataKey="macdSignal" stroke="hsl(0,85%,55%)" strokeWidth={1.5} dot={false} name="Signal" />
            </ComposedChart>
          ) : (
            <ComposedChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(215,15%,50%)" }} axisLine={false} width={65} />
              <ReferenceLine y={80} stroke="hsl(0,85%,55%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={20} stroke="hsl(145,80%,48%)" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="stochK" stroke="hsl(200,100%,55%)" strokeWidth={1.5} dot={false} name="%K" />
              <Line type="monotone" dataKey="stochD" stroke="hsl(38,95%,55%)" strokeWidth={1.5} dot={false} name="%D" />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
