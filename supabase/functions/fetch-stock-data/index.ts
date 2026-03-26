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

    // Use the v8 chart API (publicly accessible, no auth required)
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false`;

    console.log("Fetching:", chartUrl);

    let responseData: any = null;

    for (const domain of ["query1", "query2"]) {
      const fetchUrl = `https://${domain}.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false`;
      try {
        const response = await fetch(fetchUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        if (response.ok) {
          responseData = await response.json();
          break;
        } else {
          const text = await response.text();
          console.error(`${domain} error:`, response.status, text);
        }
      } catch (e) {
        console.error(`${domain} fetch error:`, e);
      }
    }

    if (!responseData) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch data for ${ticker}. Yahoo Finance API unavailable.` }),
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
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

    const data = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quote.close?.[i];
      if (close == null) continue;

      const date = new Date(timestamps[i] * 1000);
      const dateStr = date.toISOString().split("T")[0];

      data.push({
        date: dateStr,
        open: quote.open?.[i] ?? close,
        high: quote.high?.[i] ?? close,
        low: quote.low?.[i] ?? close,
        close,
        volume: quote.volume?.[i] ?? 0,
        adjClose: adjClose[i] ?? close,
      });
    }

    console.log(`Parsed ${data.length} data points for ${ticker}`);

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
