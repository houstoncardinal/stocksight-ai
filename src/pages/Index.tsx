import { motion } from "framer-motion";
import { Zap, BarChart3, TrendingUp, Shield, Brain, Activity } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import PriceChart from "@/components/PriceChart";
import PredictionPanel from "@/components/PredictionPanel";
import IndicatorPanel from "@/components/IndicatorPanel";
import FibonacciPanel from "@/components/FibonacciPanel";
import StatsBar from "@/components/StatsBar";
import SignalBadge from "@/components/SignalBadge";
import { useStockData } from "@/hooks/useStockData";

const features = [
  { icon: Brain, label: "Exponential Smoothing" },
  { icon: Activity, label: "12+ Indicators" },
  { icon: Shield, label: "Multi-Timeframe" },
];

const Index = () => {
  const { loading, error, result, fetchAndAnalyze } = useStockData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center glow-primary"
          >
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">
            AlgoVision
          </h1>
          <span className="text-[9px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            PRO
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-5 text-[11px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
            <BarChart3 className="w-3.5 h-3.5" /> Analysis
          </span>
          <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
            <TrendingUp className="w-3.5 h-3.5" /> Predictions
          </span>
          <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-default">
            <Brain className="w-3.5 h-3.5" /> AI Models
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex flex-col items-center gap-8 py-20"
          >
            {/* Mesh gradient background */}
            <div className="absolute inset-0 gradient-mesh opacity-60 pointer-events-none" />
            <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

            <div className="relative text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold tracking-tight">
                  <span className="text-foreground">Analyze. </span>
                  <span className="text-gradient-primary">Predict.</span>
                  <span className="text-foreground"> Trade.</span>
                </h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground mt-4 max-w-xl mx-auto leading-relaxed"
              >
                Advanced technical analysis powered by 12+ indicators including RSI, MACD,
                Bollinger Bands, VWAP, ADX, Fibonacci retracements, and AI-driven price predictions.
              </motion.p>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-3 mt-6"
              >
                {features.map((f, i) => (
                  <motion.div
                    key={f.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-xs font-mono text-muted-foreground"
                  >
                    <f.icon className="w-3 h-3 text-primary" />
                    {f.label}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative w-full"
            >
              <UrlInput onSubmit={fetchAndAnalyze} loading={loading} error={error} />
            </motion.div>
          </motion.div>
        )}

        {/* Input when active */}
        {(loading || result) && (
          <div className="mb-6">
            <UrlInput onSubmit={fetchAndAnalyze} loading={loading} error={error} />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-5 py-24"
          >
            <div className="relative">
              <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-accent/10 border-b-accent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-mono text-foreground">Analyzing market data...</p>
              <p className="text-xs font-mono text-muted-foreground mt-1">Running 12+ technical indicators</p>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4 animate-slide-up">
            {/* Stats + Overall Signal */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <StatsBar
                  data={result.data}
                  ticker={result.ticker}
                  currentPrice={result.currentPrice}
                  priceChange={result.priceChange}
                  priceChangePercent={result.priceChangePercent}
                />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card relative rounded-xl px-8 py-5 flex flex-col items-center justify-center gap-2 min-w-[180px]"
              >
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Overall Signal
                </span>
                <SignalBadge signal={result.overallSignal} size="lg" />
              </motion.div>
            </div>

            {/* Chart */}
            <PriceChart data={result.data} analysis={result.analysis} />

            {/* Predictions */}
            <PredictionPanel predictions={result.predictions} currentPrice={result.currentPrice} />

            {/* Fibonacci & Support/Resistance */}
            <FibonacciPanel
              fibLevels={result.analysis.fibLevels}
              currentPrice={result.currentPrice}
              supportLevels={result.analysis.supportLevels}
              resistanceLevels={result.analysis.resistanceLevels}
            />

            {/* Indicators */}
            <IndicatorPanel data={result.data} analysis={result.analysis} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <span>AlgoVision Pro · Technical Analysis Engine</span>
          <span>Data via Yahoo Finance</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
