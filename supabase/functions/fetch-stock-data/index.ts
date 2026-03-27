import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DataPoint {
  date: string; open: number; high: number; low: number;
  close: number; volume: number; adjClose: number;
}

interface AIInsights {
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  summary: string;
  keyInsight: string;
  risks: string[];
  opportunities: string[];
  priceOutlook: string;
  confidence: number;
  // Market context
  macroContext: string;
  catalysts: string[];
  headwinds: string[];
  newsScore: number;
  // Synthesis
  synthesisNote: string;
  indicatorVsPredictionNote: string;
}

async function fetchAIInsights(ticker: string, data: DataPoint[]): Promise<AIInsights | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey || data.length < 20) return null;

  try {
    const closes = data.map(d => d.close);
    const last = closes[closes.length - 1];
    const prev20 = closes[closes.length - 21];
    const change20d = (((last - prev20) / prev20) * 100).toFixed(2);
    const avgVol30 = data.slice(-30).reduce((s, d) => s + d.volume, 0) / 30;
    const volatility = data.slice(-20).reduce((s, d) => s + (d.high - d.low) / d.close, 0) / 20 * 100;
    const high52 = Math.max(...data.slice(-252).map(d => d.high));
    const low52  = Math.min(...data.slice(-252).map(d => d.low));
    const pricePos52 = ((last - low52) / (high52 - low52) * 100).toFixed(1);

    // Inline RSI
    const gains = closes.slice(1).map((c, i) => Math.max(0, c - closes[i]));
    const losses = closes.slice(1).map((c, i) => Math.max(0, closes[i] - c));
    const avgG = gains.slice(-14).reduce((a, b) => a + b, 0) / 14;
    const avgL = losses.slice(-14).reduce((a, b) => a + b, 0) / 14;
    const rsiVal = avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL);

    // 20-day trend direction
    const trend5d  = ((last - closes[closes.length - 6])  / closes[closes.length - 6]  * 100).toFixed(2);
    const trend20d = change20d;

    const recentOHLCV = data.slice(-5).map(d =>
      `${d.date}: O=$${d.open.toFixed(2)} H=$${d.high.toFixed(2)} L=$${d.low.toFixed(2)} C=$${d.close.toFixed(2)} V=${(d.volume / 1e6).toFixed(1)}M`
    ).join("\n");

    const prompt = `You are a senior quantitative analyst at a top-tier hedge fund. Provide a comprehensive, professional analysis of ${ticker}.

QUANTITATIVE DATA:
Ticker: ${ticker}
Current Price: $${last.toFixed(2)}
5-Day Change: ${trend5d}%
20-Day Change: ${trend20d}%
RSI(14): ${rsiVal.toFixed(1)}
Daily Volatility (20d avg): ${volatility.toFixed(2)}%
52W Range Position: ${pricePos52}% (0=52W Low, 100=52W High)
Avg Volume (30d): ${(avgVol30 / 1e6).toFixed(1)}M

Recent OHLCV (last 5 sessions):
${recentOHLCV}

IMPORTANT: For synthesisNote and indicatorVsPredictionNote, explicitly address the following real scenario: if RSI is overbought (>70) but price momentum is strong, OR if RSI is oversold (<30) but price is still falling — explain the contradiction clearly and professionally, with what it means for traders. Be specific, use numbers.

Respond with valid JSON only (no markdown):
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": <integer 1-100, 50=neutral>,
  "summary": "<2-3 professional sentences with specific data points and price levels>",
  "keyInsight": "<the single most important, actionable observation with specific % or $ levels>",
  "risks": ["<specific quantified risk>", "<specific quantified risk>"],
  "opportunities": ["<specific actionable opportunity>", "<specific actionable opportunity>"],
  "priceOutlook": "<1-2 sentences with approximate near-term price target or range>",
  "confidence": <integer 0-100>,
  "macroContext": "<1-2 sentences on the macro/sector environment specifically affecting ${ticker} — interest rates, sector rotation, regulatory, etc.>",
  "catalysts": ["<upcoming or recent positive catalyst specific to ${ticker}>", "<second catalyst>"],
  "headwinds": ["<structural or near-term headwind specific to ${ticker}>", "<second headwind>"],
  "newsScore": <integer 0-100, estimated sentiment from recent news/developments, 50=neutral>,
  "synthesisNote": "<explicitly compare what short-term technical indicators suggest vs what longer-term algorithmic models would project — acknowledge and explain any contradiction with specific logic>",
  "indicatorVsPredictionNote": "<1-2 sentences: if indicators are bearish but models might project recovery, or vice versa, explain WHY this divergence exists and what it means for different trader time horizons>"
}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a quantitative financial analyst. Always respond with valid JSON only. Never use markdown code blocks. Be specific with numbers and price levels." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.error("OpenAI API error:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as AIInsights;
    if (!Array.isArray(parsed.risks))        parsed.risks = [];
    if (!Array.isArray(parsed.opportunities)) parsed.opportunities = [];
    if (!Array.isArray(parsed.catalysts))    parsed.catalysts = [];
    if (!Array.isArray(parsed.headwinds))    parsed.headwinds = [];
    return parsed;
  } catch (e) {
    console.error("OpenAI processing error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/quote\/([^/]+)\/history/);
    if (!pathMatch) {
      return new Response(JSON.stringify({ error: "Invalid Yahoo Finance history URL" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ticker = pathMatch[1];
    const period1 = urlObj.searchParams.get("period1") || "0";
    const period2 = urlObj.searchParams.get("period2") || Math.floor(Date.now() / 1000).toString();

    interface YahooChartResponse {
      chart?: { result?: Array<{
        timestamp?: number[];
        indicators?: {
          quote?: Array<{ open?: (number|null)[]; high?: (number|null)[]; low?: (number|null)[]; close?: (number|null)[]; volume?: (number|null)[]; }>;
          adjclose?: Array<{ adjclose?: (number|null)[] }>;
        };
      }>; };
    }
    let responseData: YahooChartResponse | null = null;

    for (const domain of ["query1", "query2"]) {
      const fetchUrl = `https://${domain}.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false`;
      try {
        const response = await fetch(fetchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });
        if (response.ok) { responseData = await response.json(); break; }
        else console.error(`${domain} error:`, response.status, await response.text());
      } catch (e) { console.error(`${domain} fetch error:`, e); }
    }

    if (!responseData) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch data for ${ticker}.` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = responseData?.chart?.result?.[0];
    if (!result) {
      return new Response(
        JSON.stringify({ error: `No data found for ${ticker}.` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const adjCloseArr = result.indicators?.adjclose?.[0]?.adjclose || [];

    const data: DataPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quote.close?.[i];
      if (close == null) continue;
      data.push({
        date: new Date(timestamps[i] * 1000).toISOString().split("T")[0],
        open:     quote.open?.[i]   ?? close,
        high:     quote.high?.[i]   ?? close,
        low:      quote.low?.[i]    ?? close,
        close,
        volume:   quote.volume?.[i] ?? 0,
        adjClose: adjCloseArr[i]    ?? close,
      });
    }

    console.log(`Parsed ${data.length} data points for ${ticker}`);
    const aiInsights = await fetchAIInsights(ticker, data);

    return new Response(JSON.stringify({ ticker, data, aiInsights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
