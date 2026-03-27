import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, AlertCircle, Sparkles, X } from "lucide-react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  error: string | null;
}

export default function UrlInput({ onSubmit, loading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <motion.div
          animate={{
            boxShadow: focused
              ? "0 0 0 2px hsl(var(--primary) / 0.35), 0 4px 24px hsl(var(--primary) / 0.08)"
              : "0 1px 3px hsl(var(--foreground) / 0.06)",
          }}
          transition={{ duration: 0.15 }}
          className="relative rounded-2xl overflow-hidden bg-card border border-border/70"
        >
          {/* macOS-style title bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-secondary/30">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-loss/70 hover:bg-loss transition-colors cursor-pointer" />
              <div className="w-2.5 h-2.5 rounded-full bg-warn/70 hover:bg-warn transition-colors cursor-pointer" />
              <div className="w-2.5 h-2.5 rounded-full bg-gain/70 hover:bg-gain transition-colors cursor-pointer" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Yahoo Finance History URL
            </span>
          </div>

          {/* Input row */}
          <div className="flex items-center">
            <div className="pl-4 text-muted-foreground/40">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="https://finance.yahoo.com/quote/AAPL/history/?period1=...&period2=..."
              className="flex-1 bg-transparent px-3 py-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/35 outline-none"
              disabled={loading}
            />
            {url && !loading && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="px-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <motion.button
              type="submit"
              disabled={loading || !url.trim()}
              whileTap={{ scale: 0.95 }}
              className="mx-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{loading ? "Analyzing…" : "Analyze"}</span>
            </motion.button>
          </div>
        </motion.div>
      </form>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-start gap-2.5 mt-3 px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-loss mt-0.5 flex-shrink-0" />
              <p className="text-sm text-loss">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper */}
      <div className="flex items-center justify-center gap-2 mt-3.5">
        <Sparkles className="w-3 h-3 text-primary/50" />
        <p className="text-xs text-muted-foreground">
          Supports{" "}
          <span className="text-primary font-semibold">stocks</span>,{" "}
          <span className="text-accent font-semibold">crypto</span>,{" "}
          <span className="text-warn font-semibold">ETFs</span>,{" "}
          <span className="text-[hsl(var(--signal-short))] font-semibold">forex</span> and more
        </p>
      </div>
    </div>
  );
}
