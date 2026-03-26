import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, AlertCircle } from "lucide-react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  error: string | null;
}

export default function UrlInput({ onSubmit, loading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");

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
        <div className="terminal-border rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 transition-all">
          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border">
            <div className="w-2.5 h-2.5 rounded-full bg-loss/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-warn/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-gain/60" />
            <span className="text-xs text-muted-foreground font-mono ml-2">Yahoo Finance URL</span>
          </div>
          <div className="flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://finance.yahoo.com/quote/BTC-USD/history/?period1=1410912000&period2=1774556430"
              className="flex-1 bg-transparent px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-5 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 px-4 py-2.5 rounded-md bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="w-4 h-4 text-loss shrink-0" />
          <p className="text-sm text-loss">{error}</p>
        </motion.div>
      )}

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Paste any Yahoo Finance <span className="font-mono text-primary/70">/history</span> URL — supports stocks, crypto, ETFs, and more
      </p>
    </motion.div>
  );
}
