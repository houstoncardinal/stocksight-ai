import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StockDataPoint, analyzeData, AnalysisResult } from "@/lib/algorithms";
import { generatePredictions, determineSignal, Prediction, Signal } from "@/lib/predictions";

export interface StockAnalysis {
  ticker: string;
  data: StockDataPoint[];
  analysis: AnalysisResult;
  predictions: Prediction[];
  overallSignal: Signal;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
}

export function useStockData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockAnalysis | null>(null);

  const fetchAndAnalyze = async (url: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-stock-data", {
        body: { url },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.data?.length) throw new Error("No data returned");

      const stockData: StockDataPoint[] = data.data;
      const analysis = analyzeData(stockData);
      const predictions = generatePredictions(stockData, analysis);
      const overallSignal = determineSignal(stockData, analysis);

      const lastPrice = stockData[stockData.length - 1].close;
      const prevPrice = stockData[stockData.length - 2]?.close || lastPrice;
      const priceChange = lastPrice - prevPrice;
      const priceChangePercent = (priceChange / prevPrice) * 100;

      setResult({
        ticker: data.ticker,
        data: stockData,
        analysis,
        predictions,
        overallSignal,
        currentPrice: lastPrice,
        priceChange,
        priceChangePercent,
      });
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, result, fetchAndAnalyze };
}
