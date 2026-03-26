import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, AlertCircle, Sparkles } from "lucide-react";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          animate={{
            boxShadow: focused
              ? "0 0 0 1px hsl(160,100%,42%), 0 0 30px hsl(160,100%,42%,0.1)"
              : "0 0 0 1px hsl(225,15%,15%), 0 0 0 hsl(160,100%,42%,0)",
          }}
          transition={{ duration: 0.2 }}
          className="relative rounded-xl overflow-hidden bg-card"
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-loss/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warn/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-gain/60" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono ml-2 tracking-wider uppercase">
              Yahoo Finance URL
            </span>
          </div>
          <div className="flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="https://finance.yahoo.com/quote/BTC-USD/history/?period1=...&period2=..."
              className="flex-1 bg-transparent px-4 py-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="group px-6 py-4 bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
            </button>
          </div>
        </motion.div>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="w-4 h-4 text-loss shrink-0" />
          <p className="text-sm text-loss font-mono">{error}</p>
        </motion.div>
      )}

      <div className="flex items-center justify-center gap-2 mt-4">
        <Sparkles className="w-3 h-3 text-primary/50" />
        <p className="text-xs text-muted-foreground">
          Supports <span className="text-primary/70 font-mono">stocks</span>,{" "}
          <span className="text-accent/70 font-mono">crypto</span>,{" "}
          <span className="text-warn/70 font-mono">ETFs</span> and more
        </p>
      </div>
    </motion.div>
  );
}
