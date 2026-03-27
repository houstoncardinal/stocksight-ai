import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, Minus, ShieldAlert, Zap, Brain } from "lucide-react";
import { AIInsights } from "@/hooks/useStockData";

interface AIInsightPanelProps {
  insights: AIInsights;
  ticker: string;
}

function SentimentArc({ score, sentiment }: { score: number; sentiment: AIInsights["sentiment"] }) {
  const r = 52;
  const cx = 64, cy = 64;
  const startAngle = -210;
  const sweepAngle = 240;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const circumference = (sweepAngle / 360) * 2 * Math.PI * r;
  const filled = (score / 100) * circumference;

  const arcPath = (angle: number) => {
    const rad = toRad(angle);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const start  = arcPath(startAngle);
  const end    = arcPath(startAngle + sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;
  const trackD = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  const fillColor =
    sentiment === "bullish" ? "hsl(145,82%,50%)" :
    sentiment === "bearish" ? "hsl(0,86%,57%)" :
    "hsl(38,96%,56%)";

  const strokeDashoffset = circumference - filled;

  const SentimentIcon = sentiment === "bullish" ? TrendingUp
    : sentiment === "bearish" ? TrendingDown : Minus;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="128" height="100" viewBox="0 0 128 100">
        {/* Track */}
        <path d={trackD} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" strokeLinecap="round" />
        {/* Fill */}
        <motion.path
          d={trackD}
          fill="none"
          stroke={fillColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="sentiment-arc"
        />
        {/* Center score */}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontFamily: "JetBrains Mono", fontWeight: 700 }}>
          {score}
        </text>
        <text x={cx} y={cy + 13} textAnchor="middle" style={{ fontSize: 9, fontFamily: "Inter", fill: "hsl(var(--muted-foreground))", fontWeight: 600, letterSpacing: "0.1em" }}>
          SCORE
        </text>
      </svg>
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border -mt-1 ${
        sentiment === "bullish"
          ? "bg-gain/10 text-gain border-gain/20"
          : sentiment === "bearish"
          ? "bg-loss/10 text-loss border-loss/20"
          : "bg-warn/10 text-warn border-warn/20"
      }`}>
        <SentimentIcon className="w-3 h-3" />
        {sentiment.toUpperCase()}
      </div>
    </div>
  );
}

export default function AIInsightPanel({ insights, ticker }: AIInsightPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="panel-card relative"
    >
      {/* Accent line */}
      <div className="ai-accent-line" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--ai-accent))/20] to-[hsl(var(--accent))/10] border border-[hsl(var(--ai-accent))/25] flex items-center justify-center">
            <Brain className="w-4 h-4 text-ai" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI Market Analysis</h3>
            <p className="text-[10px] text-muted-foreground">GPT-4o · {ticker} · Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ai bg-[hsl(var(--ai-accent))/8] border border-[hsl(var(--ai-accent))/20] px-2.5 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          Powered by OpenAI
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Sentiment gauge + confidence */}
          <div className="flex flex-col items-center gap-4 lg:w-44 flex-shrink-0">
            <SentimentArc score={insights.sentimentScore} sentiment={insights.sentiment} />

            {/* Confidence */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-1.5 text-[10px] font-semibold">
                <span className="text-muted-foreground uppercase tracking-wider">AI Confidence</span>
                <span className="font-bold font-mono text-foreground">{insights.confidence}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${insights.confidence}%` }}
                  transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--ai-accent)), hsl(var(--accent)))" }}
                />
              </div>
            </div>
          </div>

          {/* Right: Analysis content */}
          <div className="flex-1 space-y-4">
            {/* Summary */}
            <div>
              <p className="text-sm text-foreground leading-relaxed">{insights.summary}</p>
            </div>

            {/* Key Insight */}
            <div className="flex gap-2.5 p-3.5 rounded-xl bg-[hsl(var(--ai-accent))/5] border border-[hsl(var(--ai-accent))/15]">
              <Zap className="w-4 h-4 text-ai mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-ai block mb-0.5">Key Insight</span>
                <p className="text-xs text-foreground leading-relaxed">{insights.keyInsight}</p>
              </div>
            </div>

            {/* Price Outlook */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Price Outlook</span>
              <p className="text-sm text-foreground leading-relaxed">{insights.priceOutlook}</p>
            </div>

            {/* Risks & Opportunities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Risks */}
              <div className="p-3.5 rounded-xl bg-loss/5 border border-loss/15">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-loss" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-loss">Risks</span>
                </div>
                <ul className="space-y-1.5">
                  {insights.risks.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className="flex items-start gap-2 text-xs text-foreground/80"
                    >
                      <span className="w-1 h-1 rounded-full bg-loss mt-1.5 flex-shrink-0" />
                      {r}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="p-3.5 rounded-xl bg-gain/5 border border-gain/15">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-gain" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gain">Opportunities</span>
                </div>
                <ul className="space-y-1.5">
                  {insights.opportunities.map((o, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-start gap-2 text-xs text-foreground/80"
                    >
                      <span className="w-1 h-1 rounded-full bg-gain mt-1.5 flex-shrink-0" />
                      {o}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-5 py-2.5 border-t border-border/50 bg-secondary/20">
        <p className="text-[9px] text-muted-foreground/60 text-center">
          AI analysis is for informational purposes only and does not constitute financial advice. Past performance does not guarantee future results.
        </p>
      </div>
    </motion.div>
  );
}
