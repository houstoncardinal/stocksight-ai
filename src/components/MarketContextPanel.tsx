import { motion } from "framer-motion";
import { Globe, TrendingUp, TrendingDown, Newspaper, Zap } from "lucide-react";
import { AIInsights } from "@/hooks/useStockData";

interface MarketContextPanelProps {
  insights: AIInsights;
  ticker: string;
}

function NewsScoreBar({ score }: { score: number }) {
  const color =
    score >= 65 ? "from-gain to-gain/70" :
    score >= 40 ? "from-warn to-warn/70" :
    "from-loss to-loss/70";
  const label = score >= 65 ? "Positive" : score >= 40 ? "Neutral" : "Negative";
  const textColor = score >= 65 ? "text-gain" : score >= 40 ? "text-warn" : "text-loss";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-semibold">
        <span className="text-muted-foreground uppercase tracking-wider">News Sentiment</span>
        <span className={`font-bold font-mono ${textColor}`}>{label} · {score}/100</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
        />
      </div>
    </div>
  );
}

export default function MarketContextPanel({ insights, ticker }: MarketContextPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="panel-card"
    >
      {/* Accent line */}
      <div className="card-accent-line" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Market Context</h3>
            <p className="text-[10px] text-muted-foreground">Macro · Catalysts · Headwinds · {ticker}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-ai bg-[hsl(var(--ai-accent))/8] border border-[hsl(var(--ai-accent))/20] px-2.5 py-1 rounded-full">
          <Newspaper className="w-3 h-3" />
          AI Research
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* News Score */}
        <NewsScoreBar score={insights.newsScore} />

        {/* Macro Context */}
        <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Macro Environment</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{insights.macroContext}</p>
        </div>

        {/* Catalysts & Headwinds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Catalysts */}
          <div className="p-3.5 rounded-xl bg-gain/5 border border-gain/15">
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="w-3.5 h-3.5 text-gain" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gain">Catalysts</span>
            </div>
            <ul className="space-y-2">
              {insights.catalysts.length > 0 ? insights.catalysts.map((c, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  className="flex items-start gap-2 text-xs text-foreground/85"
                >
                  <span className="w-1 h-1 rounded-full bg-gain mt-1.5 flex-shrink-0" />
                  {c}
                </motion.li>
              )) : (
                <li className="text-xs text-muted-foreground italic">No catalysts identified</li>
              )}
            </ul>
          </div>

          {/* Headwinds */}
          <div className="p-3.5 rounded-xl bg-loss/5 border border-loss/15">
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingDown className="w-3.5 h-3.5 text-loss" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-loss">Headwinds</span>
            </div>
            <ul className="space-y-2">
              {insights.headwinds.length > 0 ? insights.headwinds.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-start gap-2 text-xs text-foreground/85"
                >
                  <span className="w-1 h-1 rounded-full bg-loss mt-1.5 flex-shrink-0" />
                  {h}
                </motion.li>
              )) : (
                <li className="text-xs text-muted-foreground italic">No headwinds identified</li>
              )}
            </ul>
          </div>
        </div>

        {/* Price Outlook callout */}
        <div className="flex gap-2.5 p-3.5 rounded-xl bg-[hsl(var(--ai-accent))/5] border border-[hsl(var(--ai-accent))/15]">
          <Zap className="w-4 h-4 text-ai mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ai block mb-0.5">Price Outlook</span>
            <p className="text-xs text-foreground leading-relaxed">{insights.priceOutlook}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
