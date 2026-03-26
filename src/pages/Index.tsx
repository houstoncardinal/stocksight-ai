import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Zap } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import PriceChart from "@/components/PriceChart";
import PredictionPanel from "@/components/PredictionPanel";
import IndicatorPanel from "@/components/IndicatorPanel";
import StatsBar from "@/components/StatsBar";
import SignalBadge from "@/components/SignalBadge";
import { useStockData } from "@/hooks/useStockData";

const Index = () => {
  const { loading, error, result, fetchAndAnalyze } = useStockData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">
            AlgoVision
          </h1>
          <span className="text-[10px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            v1.0
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Technical Analysis
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Predictions
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero / Input */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 py-16"
          >
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-mono font-bold text-foreground tracking-tight">
                Analyze. Predict. Trade.
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
                Paste a Yahoo Finance history URL to unlock deep technical analysis with
                exponential smoothing, RSI, MACD, Bollinger Bands, and AI-powered predictions.
              </p>
            </div>
            <UrlInput onSubmit={fetchAndAnalyze} loading={loading} error={error} />
          </motion.div>
        )}

        {/* Loading / Input when active */}
        {(loading || result) && (
          <div className="mb-6">
            <UrlInput onSubmit={fetchAndAnalyze} loading={loading} error={error} />
          </div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 py-20"
          >
            <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-mono text-muted-foreground">Fetching & analyzing data...</p>
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
              <div className="terminal-border rounded-lg px-6 py-4 flex flex-col items-center justify-center gap-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Overall Signal
                </span>
                <SignalBadge signal={result.overallSignal} size="lg" />
              </div>
            </div>

            {/* Chart */}
            <PriceChart data={result.data} analysis={result.analysis} />

            {/* Predictions */}
            <PredictionPanel predictions={result.predictions} currentPrice={result.currentPrice} />

            {/* Indicators */}
            <IndicatorPanel data={result.data} analysis={result.analysis} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
