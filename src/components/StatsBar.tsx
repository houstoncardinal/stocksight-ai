import { motion } from "framer-motion";
import { StockDataPoint } from "@/lib/algorithms";
import { TrendingUp, TrendingDown, Activity, BarChart2, Calendar, Target } from "lucide-react";

interface StatsBarProps {
  data: StockDataPoint[];
  ticker: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

export default function StatsBar({ data, ticker, currentPrice, priceChange, priceChangePercent }: StatsBarProps) {
  const isPositive = priceChange >= 0;
  const high52 = Math.max(...data.slice(-252).map((d) => d.high));
  const low52 = Math.min(...data.slice(-252).map((d) => d.low));
  const avgVolume = data.slice(-30).reduce((s, d) => s + d.volume, 0) / Math.min(30, data.length);
  const totalDays = data.length;
  const volatility = data.slice(-30).reduce((s, d) => s + (d.high - d.low) / d.close, 0) / 30 * 100;
  const pricePos = high52 !== low52 ? ((currentPrice - low52) / (high52 - low52)) * 100 : 50;

  const formatNumber = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const formatPrice = (p: number) =>
    p < 1
      ? `$${p.toFixed(6)}`
      : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stats = [
    { label: "52W High", value: formatPrice(high52), icon: TrendingUp },
    { label: "52W Low", value: formatPrice(low52), icon: TrendingDown },
    { label: "Avg Vol (30d)", value: formatNumber(avgVolume), icon: BarChart2 },
    { label: "Volatility", value: `${volatility.toFixed(2)}%`, icon: Activity },
    { label: "Data Points", value: totalDays.toLocaleString(), icon: Calendar },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card relative rounded-xl px-6 py-5 overflow-hidden"
    >
      <div className="relative z-10">
        {/* Ticker & Price Row */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-mono font-bold text-foreground tracking-wide">{ticker}</h2>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${
                isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </div>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-mono font-bold text-foreground">
                {formatPrice(currentPrice)}
              </span>
              <span className={`text-sm font-mono font-semibold ${isPositive ? "text-gain" : "text-loss"}`}>
                {isPositive ? "+" : ""}{formatPrice(priceChange)}
              </span>
            </div>
          </div>

          {/* 52W Range Bar */}
          <div className="min-w-[200px]">
            <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1.5">
              <span>{formatPrice(low52)}</span>
              <span className="text-foreground/60 flex items-center gap-1">
                <Target className="w-2.5 h-2.5" /> 52W Range
              </span>
              <span>{formatPrice(high52)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pricePos}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-loss via-warn to-gain"
              />
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${pricePos}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center gap-2"
            >
              <stat.icon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{stat.label}</span>
              <span className="text-xs font-mono font-semibold text-foreground">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
