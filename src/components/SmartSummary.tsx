import { motion } from "framer-motion";
import { Brain, AlertTriangle, CheckCircle2, ArrowRight, GitMerge } from "lucide-react";
import { Signal, Prediction } from "@/lib/predictions";
import { AIInsights } from "@/hooks/useStockData";

interface SmartSummaryProps {
  overallSignal: Signal;
  predictions: Prediction[];
  aiInsights: AIInsights | null;
  ticker: string;
}

function isBullish(s: Signal) {
  return s === "STRONG_BUY" || s === "BUY";
}
function isBearish(s: Signal) {
  return s === "STRONG_SELL" || s === "SELL" || s === "SHORT";
}

function signalLabel(s: Signal): string {
  switch (s) {
    case "STRONG_BUY":  return "Strong Buy";
    case "BUY":         return "Buy";
    case "HOLD":        return "Hold";
    case "SELL":        return "Sell";
    case "STRONG_SELL": return "Strong Sell";
    case "SHORT":       return "Short";
  }
}

export default function SmartSummary({ overallSignal, predictions, aiInsights, ticker }: SmartSummaryProps) {
  const nearTermPred = predictions[0]; // 1D
  const longTermPred = predictions[predictions.length - 1]; // 1Y

  const indicatorsBullish = isBullish(overallSignal);
  const indicatorsBearish = isBearish(overallSignal);
  const predBullish = nearTermPred.changePercent > 1;
  const predBearish = nearTermPred.changePercent < -1;

  const hasContradiction =
    (indicatorsBullish && predBearish) ||
    (indicatorsBearish && predBullish);

  const contradictionType: "ind-bear-pred-bull" | "ind-bull-pred-bear" | "none" =
    indicatorsBearish && predBullish ? "ind-bear-pred-bull" :
    indicatorsBullish && predBearish ? "ind-bull-pred-bear" : "none";

  const status = hasContradiction ? "contradiction" :
    (indicatorsBullish && predBullish) || (indicatorsBearish && predBearish) ? "aligned-bear" :
    "aligned-bull";
  const isAligned = !hasContradiction;
  const bothBullish = indicatorsBullish && predBullish;

  // Build contextual explanation
  const getExplanation = () => {
    if (aiInsights?.synthesisNote) return aiInsights.synthesisNote;

    if (contradictionType === "ind-bear-pred-bull") {
      return `Technical indicators signal ${signalLabel(overallSignal)} on ${ticker}, yet short-term algorithmic models project a +${nearTermPred.changePercent.toFixed(2)}% move. This divergence typically indicates the stock is oversold relative to its momentum model — indicators reflect current weakness while predictive models anticipate mean reversion.`;
    }
    if (contradictionType === "ind-bull-pred-bear") {
      return `Technical indicators signal ${signalLabel(overallSignal)} on ${ticker}, yet short-term models project ${nearTermPred.changePercent.toFixed(2)}%. This suggests the stock may be technically extended — indicators capture recent strength while models project mean reversion or exhaustion.`;
    }
    if (bothBullish) {
      return `Technical indicators and predictive models are aligned bullish on ${ticker}. Indicators signal ${signalLabel(overallSignal)} while models project +${nearTermPred.changePercent.toFixed(2)}% near-term and +${longTermPred.changePercent.toFixed(2)}% longer-term, reinforcing the upside thesis.`;
    }
    return `Technical indicators (${signalLabel(overallSignal)}) and predictive models (${nearTermPred.changePercent.toFixed(2)}% near-term) are broadly aligned on ${ticker}. The overall signal reflects consistent data across multiple timeframes.`;
  };

  const getDivergenceNote = () => {
    if (aiInsights?.indicatorVsPredictionNote) return aiInsights.indicatorVsPredictionNote;
    if (!hasContradiction) return null;
    if (contradictionType === "ind-bear-pred-bull") {
      return "Short-term traders should respect the bearish indicator regime. Swing and position traders may watch for a reversal confirmation before acting on the model's projected recovery.";
    }
    return "Day traders may ride the bullish indicator momentum. Longer-horizon investors should be cautious of the model's projected pullback from elevated levels.";
  };

  const accentClass = hasContradiction
    ? "border-warn/40 bg-warn/[0.03]"
    : bothBullish
    ? "border-gain/40 bg-gain/[0.03]"
    : "border-loss/30 bg-loss/[0.03]";

  const iconColor = hasContradiction ? "text-warn" : bothBullish ? "text-gain" : "text-loss";
  const StatusIcon = hasContradiction ? AlertTriangle : CheckCircle2;

  const divergenceNote = getDivergenceNote();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`panel-card border ${accentClass} overflow-hidden`}
    >
      {/* Accent top bar */}
      <div className={`h-[2px] w-full ${hasContradiction ? "bg-gradient-to-r from-warn/60 via-warn to-warn/60" : bothBullish ? "bg-gradient-to-r from-gain/60 via-gain to-gain/60" : "bg-gradient-to-r from-loss/60 via-loss to-loss/60"}`} />

      <div className="px-5 py-4 flex flex-col lg:flex-row gap-5">
        {/* Left — status block */}
        <div className="flex flex-row lg:flex-col items-start lg:items-center gap-4 lg:gap-3 lg:w-52 lg:flex-shrink-0 lg:border-r lg:border-border/60 lg:pr-5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${hasContradiction ? "bg-warn/10 border border-warn/20" : bothBullish ? "bg-gain/10 border border-gain/20" : "bg-loss/10 border border-loss/20"}`}>
            <GitMerge className={`w-5 h-5 ${iconColor}`} />
          </div>

          <div className="flex-1 lg:text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Smart Synthesis</p>
            <p className={`text-xs font-bold ${iconColor}`}>
              {hasContradiction ? "Contradiction Detected" : isAligned ? "Signals Aligned" : "Mixed Signals"}
            </p>
          </div>

          {/* Signals comparison */}
          <div className="hidden lg:flex items-center gap-2 mt-1">
            {/* Indicator signal */}
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground mb-1">Indicators</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                indicatorsBullish ? "bg-gain/10 text-gain border-gain/25" :
                indicatorsBearish ? "bg-loss/10 text-loss border-loss/25" :
                "bg-warn/10 text-warn border-warn/25"
              }`}>
                {signalLabel(overallSignal)}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            {/* Prediction signal */}
            <div className="text-center">
              <p className="text-[8px] uppercase tracking-wider text-muted-foreground mb-1">Models</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                predBullish ? "bg-gain/10 text-gain border-gain/25" :
                predBearish ? "bg-loss/10 text-loss border-loss/25" :
                "bg-warn/10 text-warn border-warn/25"
              }`}>
                {nearTermPred.changePercent > 0 ? "+" : ""}{nearTermPred.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right — synthesis content */}
        <div className="flex-1 space-y-3.5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-ai flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-ai">
              {hasContradiction ? "AI Synthesis · Contradiction Analysis" : "AI Synthesis · Signal Confirmation"}
            </span>
            {aiInsights && (
              <span className="ml-auto text-[9px] text-muted-foreground/60 hidden sm:block">Powered by GPT-4o</span>
            )}
          </div>

          {/* Main explanation */}
          <div className={`p-3.5 rounded-xl border ${hasContradiction ? "bg-warn/[0.04] border-warn/20" : bothBullish ? "bg-gain/[0.04] border-gain/20" : "bg-loss/[0.04] border-loss/20"}`}>
            <div className="flex gap-2.5">
              <StatusIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <p className="text-xs text-foreground leading-relaxed">{getExplanation()}</p>
            </div>
          </div>

          {/* Divergence note for traders */}
          {divergenceNote && (
            <div className="flex gap-2.5 p-3 rounded-xl bg-secondary/40 border border-border/50">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{divergenceNote}</p>
            </div>
          )}

          {/* Inline signals (mobile) */}
          <div className="lg:hidden flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Indicators:</span>
              <span className={`font-bold ${indicatorsBullish ? "text-gain" : indicatorsBearish ? "text-loss" : "text-warn"}`}>
                {signalLabel(overallSignal)}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Models (1D):</span>
              <span className={`font-bold ${predBullish ? "text-gain" : predBearish ? "text-loss" : "text-warn"}`}>
                {nearTermPred.changePercent > 0 ? "+" : ""}{nearTermPred.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
