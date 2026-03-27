import { motion } from "framer-motion";
import { StockDataPoint } from "@/lib/algorithms";
import { TrendingUp, TrendingDown, Activity, BarChart2, Calendar, Target, Layers } from "lucide-react";

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
  const low52  = Math.min(...data.slice(-252).map((d) => d.low));
  const avgVolume  = data.slice(-30).reduce((s, d) => s + d.volume, 0) / Math.min(30, data.length);
  const volatility = data.slice(-30).reduce((s, d) => s + (d.high - d.low) / d.close, 0) / 30 * 100;
  const pricePos   = high52 !== low52 ? ((currentPrice - low52) / (high52 - low52)) * 100 : 50;

  const formatNum = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const fmt = (p: number) =>
    p < 1
      ? `$${p.toFixed(6)}`
      : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const stats = [
    { label: "52W High",    value: fmt(high52),                  icon: TrendingUp,   positive: true  },
    { label: "52W Low",     value: fmt(low52),                   icon: TrendingDown, positive: false },
    { label: "Avg Vol 30d", value: formatNum(avgVolume),         icon: BarChart2,    positive: null  },
    { label: "Volatility",  value: `${volatility.toFixed(2)}%`,  icon: Activity,     positive: null  },
    { label: "Data Points", value: data.length.toLocaleString(), icon: Calendar,     positive: null  },
    { label: "Range",       value: `${fmt(low52)} – ${fmt(high52)}`, icon: Layers,   positive: null  },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card relative rounded-2xl overflow-hidden"
    >
      <div className="relative z-10 p-5 sm:p-6">
        {/* Top row: ticker + price + change */}
        <div className="flex flex-wrap items-start gap-5 mb-5">
          <div className="flex-1 min-w-0">
            {/* Ticker */}
            <div className="flex items-center gap-3 mb-1.5">
              <h2 className="text-3xl font-bold tracking-tight text-foreground leading-none">{ticker}</h2>
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isPositive
                    ? "bg-gain/10 text-gain border border-gain/20"
                    : "bg-loss/10 text-loss border border-loss/20"
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </motion.div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-mono text-foreground tracking-tight">
                {fmt(currentPrice)}
              </span>
              <span className={`text-sm font-semibold font-mono ${isPositive ? "text-gain" : "text-loss"}`}>
                {isPositive ? "+" : ""}{fmt(priceChange)}
              </span>
            </div>
          </div>

          {/* 52W Range */}
          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <div className="flex items-center justify-between mb-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="font-mono">{fmt(low52)}</span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" /> 52-Week Range
              </span>
              <span className="font-mono">{fmt(high52)}</span>
            </div>
            <div className="relative h-2 rounded-full bg-secondary overflow-visible">
              {/* Gradient track */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-loss/40 via-warn/40 to-gain/40" />
              {/* Fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pricePos}%` }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-loss via-warn to-gain"
              />
              {/* Thumb */}
              <motion.div
                initial={{ left: "0%" }}
                animate={{ left: `${pricePos}%` }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-foreground border-2 border-primary shadow-md"
              />
            </div>
            <div className="text-center mt-2 text-[10px] font-medium text-muted-foreground">
              Current: <span className="text-foreground font-mono font-semibold">{pricePos.toFixed(1)}%</span> of range
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="card-header-line mb-4" />

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.slice(0, 5).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center gap-1.5">
                <stat.icon className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              </div>
              <span className={`text-sm font-bold font-mono ${
                stat.positive === true  ? "text-gain" :
                stat.positive === false ? "text-loss" :
                "text-foreground"
              }`}>
                {stat.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
