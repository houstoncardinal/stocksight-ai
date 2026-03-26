import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the Yahoo Finance URL to extract ticker and date range
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/quote\/([^/]+)\/history/);
    if (!pathMatch) {
      return new Response(JSON.stringify({ error: "Invalid Yahoo Finance history URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ticker = pathMatch[1];
    const period1 = urlObj.searchParams.get("period1") || "0";
    const period2 = urlObj.searchParams.get("period2") || Math.floor(Date.now() / 1000).toString();

    // Fetch CSV data from Yahoo Finance
    const csvUrl = `https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;

    console.log("Fetching:", csvUrl);

    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      // Fallback: try query2
      const fallbackUrl = `https://query2.finance.yahoo.com/v7/finance/download/${ticker}?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`;
      const fallbackResp = await fetch(fallbackUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!fallbackResp.ok) {
        const text = await fallbackResp.text();
        console.error("Yahoo Finance error:", fallbackResp.status, text);
        return new Response(
          JSON.stringify({ error: `Failed to fetch data for ${ticker}. Yahoo Finance returned ${fallbackResp.status}.` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const csv = await fallbackResp.text();
      const data = parseCSV(csv, ticker);
      return new Response(JSON.stringify({ ticker, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const csv = await response.text();
    const data = parseCSV(csv, ticker);
    return new Response(JSON.stringify({ ticker, data }), {
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

function parseCSV(csv: string, ticker: string) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",");
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length < 6) continue;
    const close = parseFloat(values[4]);
    if (isNaN(close) || values[4] === "null") continue;

    data.push({
      date: values[0],
      open: parseFloat(values[1]) || close,
      high: parseFloat(values[2]) || close,
      low: parseFloat(values[3]) || close,
      close,
      volume: parseInt(values[5]) || 0,
      adjClose: parseFloat(values[6]) || close,
    });
  }

  return data;
}
