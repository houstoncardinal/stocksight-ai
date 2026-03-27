import { motion, AnimatePresence } from "framer-motion";
import { Zap, BarChart3, TrendingUp, Brain, Activity, Shield, Sparkles, GitBranch, Cpu, AlertTriangle, Gauge, Eye, History } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import PriceChart from "@/components/PriceChart";
import PredictionPanel from "@/components/PredictionPanel";
import IndicatorPanel from "@/components/IndicatorPanel";
import FibonacciPanel from "@/components/FibonacciPanel";
import StatsBar from "@/components/StatsBar";
import SignalBadge from "@/components/SignalBadge";
import ThemeToggle from "@/components/ThemeToggle";
import AIInsightPanel from "@/components/AIInsightPanel";
import SmartSummary from "@/components/SmartSummary";
import MarketContextPanel from "@/components/MarketContextPanel";
import { useStockData } from "@/hooks/useStockData";
import { detectMarketRegime, checkBlackSwanRisk, MarketRegime, BlackSwanAlert } from "@/lib/predictions";

const features = [
  { icon: Brain,      label: "18+ Algorithms",       color: "text-accent"  },
  { icon: Cpu,        label: "GPT-4o Analysis",       color: "text-ai"      },
  { icon: Activity,   label: "Ichimoku · CCI · MFI",  color: "text-primary" },
  { icon: Shield,     label: "Pivot Points",          color: "text-warn"    },
  { icon: GitBranch,  label: "Fibonacci Levels",      color: "text-[hsl(var(--signal-short))]" },
  { icon: TrendingUp, label: "Multi-Model Prediction",color: "text-gain"    },
];

const LOADING_STEPS = [
  "Fetching OHLCV data from Yahoo Finance…",
  "Computing 18+ technical indicators…",
  "Running Ichimoku Cloud analysis…",
  "Generating AI price predictions…",
  "Calling GPT-4o for market insights…",
];

export default function Index() {
  const { loading, error, result, fetchAndAnalyze } = useStockData();

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-xl shadow-lg shadow-black/5">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-accent to-[hsl(var(--chart-2))] flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <div className="absolute inset-0.5 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
              <Zap className="w-5 h-5 text-white relative z-10" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gain rounded-full animate-pulse" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                AlgoVision
                <span className="hidden sm:inline text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full tracking-widest uppercase">
                  Pro
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground/60 hidden sm:block">Institutional-grade analysis</span>
            </div>
          </div>

          {/* Center Navigation - World Class */}
          <nav className="hidden lg:flex items-center gap-1 bg-secondary/50 rounded-2xl p-1">
            {[
              { icon: BarChart3, label: "Analysis", active: true },
              { icon: TrendingUp, label: "Predictions", active: false },
              { icon: Brain, label: "AI Models", active: false },
              { icon: Activity, label: "Indicators", active: false },
              { icon: History, label: "Backtest", active: false },
            ].map((item, i) => (
              <button key={item.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  item.active
                    ? "bg-card shadow-md text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <item.icon className={`w-4 h-4 ${item.active ? "text-primary" : ""}`} />
                {item.label}
                {item.active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute w-1 h-1 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Live Price Badge */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-card border border-border/60 shadow-md"
              >
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground/60 font-medium">{result.ticker}</span>
                  <span className="text-sm font-bold font-mono text-foreground">${result.currentPrice.toFixed(2)}</span>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gain animate-pulse" />
                    <span className="text-xs font-bold text-gain">
                      {result.priceChange >= 0 ? "+" : ""}{result.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-[9px] text-muted-foreground/60">Today</span>
                </div>
              </motion.div>
            )}
            
            {/* Search Button */}
            <button className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs font-medium">Search</span>
            </button>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        {/* ── Hero ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!result && !loading && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -16 }}
              className="relative flex flex-col items-center gap-12 py-16 sm:py-24"
            >
              <div className="absolute inset-0 gradient-mesh opacity-80 pointer-events-none" />
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

              <div className="relative text-center max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                >
                  <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-card border border-border/70 text-xs font-semibold text-muted-foreground shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
                    Institutional-grade quantitative analysis
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>

                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-2">
                    <span className="text-foreground">The smarter way</span>
                    <br />
                    <span className="text-gradient-primary">to read markets.</span>
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto"
                >
                  18+ proven algorithms — RSI, MACD, Ichimoku Cloud, CCI, MFI, Aroon, Pivot Points,
                  Fibonacci — combined with <span className="text-gradient-ai font-semibold">GPT-4o AI analysis</span> for
                  data-driven market intelligence.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex flex-wrap items-center justify-center gap-2 mt-8"
                >
                  {features.map((f, i) => (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border/60 text-xs font-medium text-muted-foreground shadow-sm"
                    >
                      <f.icon className={`w-3.5 h-3.5 ${f.color}`} />
                      {f.label}
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="relative w-full"
              >
                <UrlInput onSubmit={fetchAndAnalyze} loading={loading} error={error} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input bar (active) ── */}
        {(loading || result) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <UrlInput onSubmit={fetchAndAnalyze} loading={loading} error={error} />
          </motion.div>
        )}

        {/* ── Loading ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 py-28"
            >
              {/* Spinner */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-[2.5px] border-primary/20 border-t-primary animate-spin" />
                <div className="absolute inset-2 rounded-full border-[2px] border-accent/15 border-b-accent animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "1.3s" }} />
                <div className="absolute inset-4 rounded-full border-[1.5px] border-[hsl(var(--ai-accent))/20] border-l-[hsl(var(--ai-accent))] animate-spin"
                  style={{ animationDuration: "2s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-bold text-foreground">Analyzing market data</p>
                <div className="flex flex-col gap-1.5 mt-3">
                  {LOADING_STEPS.map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.4 }}
                      className="flex items-center gap-2.5 text-xs text-muted-foreground"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.4 + 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                      />
                      {step}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="w-full max-w-lg space-y-2.5">
                {[100, 85, 92, 70, 78].map((w, i) => (
                  <div key={i} className="shimmer h-2.5 rounded-full" style={{ width: `${w}%` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Row 0: Smart Synthesis */}
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <SmartSummary
                  overallSignal={result.overallSignal}
                  predictions={result.predictions}
                  aiInsights={result.aiInsights}
                  ticker={result.ticker}
                />
              </motion.div>

              {/* Market Regime & Black Swan Alerts */}
              {(() => {
                const regime = detectMarketRegime(result.data, result.analysis);
                const blackSwan = checkBlackSwanRisk(result.data, result.analysis);
                
                return (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
                    <div className="panel-card border-l-4 overflow-hidden">
                      {/* Regime Detection Bar */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
                        <div className="flex items-center gap-2.5">
                          <Gauge className={`w-4 h-4 ${
                            regime.regime === "BULL_TREND" ? "text-gain" :
                            regime.regime === "BEAR_TREND" ? "text-loss" :
                            regime.regime === "HIGH_VOLATILITY" ? "text-warn" :
                            "text-primary"
                          }`} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Market Regime</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            regime.regime === "BULL_TREND" ? "bg-gain/10 text-gain border border-gain/20" :
                            regime.regime === "BEAR_TREND" ? "bg-loss/10 text-loss border border-loss/20" :
                            regime.regime === "HIGH_VOLATILITY" ? "bg-warn/10 text-warn border border-warn/20" :
                            regime.regime === "LOW_VOLATILITY" ? "bg-primary/10 text-primary border border-primary/20" :
                            "bg-secondary text-foreground border border-border"
                          }`}>
                            {regime.regime.replace("_", " ")}
                          </span>
                          <span className="text-[9px] text-muted-foreground/60">
                            Confidence: {regime.confidence}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Regime Signals */}
                      <div className="px-5 py-2.5 bg-secondary/20">
                        <div className="flex flex-wrap gap-1.5">
                          {regime.signals.slice(0, 4).map((sig, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-card border border-border/50 text-muted-foreground">
                              {sig}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Black Swan Alert */}
                      {blackSwan.active && (
                        <div className={`px-5 py-3 ${
                          blackSwan.level === "HIGH" ? "bg-loss/10" :
                          blackSwan.level === "MEDIUM" ? "bg-warn/10" : "bg-secondary/30"
                        }`}>
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              blackSwan.level === "HIGH" ? "text-loss" :
                              blackSwan.level === "MEDIUM" ? "text-warn" : "text-muted-foreground"
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  blackSwan.level === "HIGH" ? "text-loss" :
                                  blackSwan.level === "MEDIUM" ? "text-warn" : "text-muted-foreground"
                                }`}>
                                  {blackSwan.level} RISK ALERT
                                </span>
                              </div>
                              <p className="text-xs text-foreground/90">{blackSwan.recommendation}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {blackSwan.reasons.slice(0, 3).map((r, i) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-card/50 text-muted-foreground/70">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })()}

              {/* Row 1: Stats + Signal */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col xl:flex-row gap-4"
              >
                <div className="flex-1 min-w-0">
                  <StatsBar
                    data={result.data}
                    ticker={result.ticker}
                    currentPrice={result.currentPrice}
                    priceChange={result.priceChange}
                    priceChangePercent={result.priceChangePercent}
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.93 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className="glass-card relative rounded-2xl px-8 py-6 flex flex-col items-center justify-center gap-3 xl:min-w-[200px]"
                >
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Overall Signal
                  </span>
                  <SignalBadge signal={result.overallSignal} size="lg" />
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">
                    Based on {result.analysis.rsi.filter(v => !isNaN(v)).length > 0 ? "18+ indicators" : "all indicators"}
                  </span>
                </motion.div>
              </motion.div>

              {/* Row 2: Price Chart (full width) */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <PriceChart data={result.data} analysis={result.analysis} enableBacktest={true} />
              </motion.div>

              {/* Row 3: AI Insights + Predictions */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                {result.aiInsights ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="xl:col-span-2"
                    >
                      <AIInsightPanel insights={result.aiInsights} ticker={result.ticker} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 }}
                      className="xl:col-span-3"
                    >
                      <PredictionPanel predictions={result.predictions} currentPrice={result.currentPrice} />
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="xl:col-span-5"
                  >
                    <PredictionPanel predictions={result.predictions} currentPrice={result.currentPrice} />
                  </motion.div>
                )}
              </div>

              {/* Row 3b: Market Context (when AI insights available) */}
              {result.aiInsights && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
                  <MarketContextPanel insights={result.aiInsights} ticker={result.ticker} />
                </motion.div>
              )}

              {/* Row 4: Fibonacci */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <FibonacciPanel
                  fibLevels={result.analysis.fibLevels}
                  currentPrice={result.currentPrice}
                  supportLevels={result.analysis.supportLevels}
                  resistanceLevels={result.analysis.resistanceLevels}
                />
              </motion.div>

              {/* Row 5: Indicators */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <IndicatorPanel data={result.data} analysis={result.analysis} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-border/50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/80 to-accent/60 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">AlgoVision Pro</span>
            <span className="text-border">·</span>
            <span className="text-xs text-muted-foreground/60">18+ Technical Algorithms</span>
            <span className="text-border">·</span>
            <span className="text-xs text-muted-foreground/60">GPT-4o AI Analysis</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/50">
            <span>For informational purposes only · Not financial advice · Data via Yahoo Finance</span>
            <span className="hidden sm:inline text-border">·</span>
            <a 
              href="https://www.visitcardinal.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Developed By Hunain Qureshi of Cardinal Consulting
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
