import { motion } from "framer-motion";
import { StockDataPoint } from "@/lib/algorithms";

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

  const formatNumber = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toFixed(0);
  };

  const formatPrice = (p: number) => (p < 1 ? `$${p.toFixed(6)}` : `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="terminal-border rounded-lg px-5 py-4"
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {/* Ticker & Price */}
        <div>
          <h2 className="text-xl font-mono font-bold text-foreground tracking-wide">{ticker}</h2>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className="text-2xl font-mono font-bold text-foreground">
              {formatPrice(currentPrice)}
            </span>
            <span className={`text-sm font-mono font-semibold ${isPositive ? "text-gain" : "text-loss"}`}>
              {isPositive ? "+" : ""}
              {formatPrice(priceChange)} ({isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 text-xs font-mono">
          <div>
            <span className="text-muted-foreground">52W High</span>
            <p className="text-foreground font-semibold">{formatPrice(high52)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">52W Low</span>
            <p className="text-foreground font-semibold">{formatPrice(low52)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Avg Vol (30d)</span>
            <p className="text-foreground font-semibold">{formatNumber(avgVolume)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data Points</span>
            <p className="text-foreground font-semibold">{totalDays.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
