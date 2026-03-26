import { StockDataPoint, AnalysisResult } from "./algorithms";

export type Signal = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL" | "SHORT";
export type TimeFrame = "1D" | "1W" | "1M" | "1Y";

export interface Prediction {
  timeFrame: TimeFrame;
  label: string;
  predictedPrice: number;
  confidence: number;
  changePercent: number;
  signal: Signal;
}

// Double Exponential Smoothing (Holt's method)
function holtSmoothing(data: number[], alpha = 0.3, beta = 0.1, periods = 1): number {
  if (data.length < 2) return data[data.length - 1] || 0;
  let level = data[0];
  let trend = data[1] - data[0];

  for (let i = 1; i < data.length; i++) {
    const newLevel = alpha * data[i] + (1 - alpha) * (level + trend);
    trend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
  }

  return level + trend * periods;
}

// Weighted moving average prediction
function wmaPrediction(data: number[], periods: number): number {
  const lookback = Math.min(data.length, 60);
  const recent = data.slice(-lookback);
  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < recent.length; i++) {
    const weight = i + 1;
    weightedSum += recent[i] * weight;
    weightTotal += weight;
  }

  const wma = weightedSum / weightTotal;
  const lastPrice = data[data.length - 1];
  const momentum = (lastPrice - data[data.length - Math.min(periods, data.length)]) / Math.min(periods, data.length);
  return wma + momentum * periods * 0.3;
}

// Determine signal from indicators
export function determineSignal(data: StockDataPoint[], analysis: AnalysisResult): Signal {
  const len = data.length - 1;
  let score = 0;

  // RSI
  const currentRSI = analysis.rsi[len];
  if (!isNaN(currentRSI)) {
    if (currentRSI < 30) score += 2;
    else if (currentRSI < 40) score += 1;
    else if (currentRSI > 70) score -= 2;
    else if (currentRSI > 60) score -= 1;
  }

  // MACD
  const currentMACD = analysis.macd[len];
  const currentSignal = analysis.macdSignal[len];
  if (!isNaN(currentMACD) && !isNaN(currentSignal)) {
    if (currentMACD > currentSignal) score += 1;
    else score -= 1;
    if (analysis.macdHistogram[len] > 0 && analysis.macdHistogram[len - 1] < 0) score += 1;
    if (analysis.macdHistogram[len] < 0 && analysis.macdHistogram[len - 1] > 0) score -= 1;
  }

  // Price vs SMA
  const price = data[len].close;
  const sma20 = analysis.sma20[len];
  const sma50 = analysis.sma50[len];
  if (!isNaN(sma20)) {
    if (price > sma20) score += 1;
    else score -= 1;
  }
  if (!isNaN(sma50)) {
    if (price > sma50) score += 1;
    else score -= 1;
  }

  // Bollinger position
  const bbUpper = analysis.bollingerUpper[len];
  const bbLower = analysis.bollingerLower[len];
  if (!isNaN(bbUpper) && !isNaN(bbLower)) {
    if (price <= bbLower) score += 2;
    if (price >= bbUpper) score -= 2;
  }

  // Stochastic
  const stochK = analysis.stochK[len];
  if (!isNaN(stochK)) {
    if (stochK < 20) score += 1;
    if (stochK > 80) score -= 1;
  }

  if (score >= 5) return "STRONG_BUY";
  if (score >= 2) return "BUY";
  if (score <= -5) return "SHORT";
  if (score <= -2) return "STRONG_SELL";
  if (score <= -1) return "SELL";
  return "HOLD";
}

export function generatePredictions(data: StockDataPoint[], analysis: AnalysisResult): Prediction[] {
  const closes = data.map((d) => d.close);
  const lastPrice = closes[closes.length - 1];

  const frames: { tf: TimeFrame; label: string; periods: number }[] = [
    { tf: "1D", label: "Next Day", periods: 1 },
    { tf: "1W", label: "Next Week", periods: 5 },
    { tf: "1M", label: "Next Month", periods: 22 },
    { tf: "1Y", label: "Next Year", periods: 252 },
  ];

  return frames.map(({ tf, label, periods }) => {
    const holt = holtSmoothing(closes, 0.3, 0.1, periods);
    const wma = wmaPrediction(closes, periods);
    // Ensemble average
    const predicted = (holt + wma) / 2;
    const changePercent = ((predicted - lastPrice) / lastPrice) * 100;

    // Confidence decreases with time horizon
    const baseConfidence = 75;
    const decay = Math.min(periods / 252, 1);
    const confidence = Math.max(35, baseConfidence - decay * 40);

    let signal: Signal;
    if (changePercent > 10) signal = "STRONG_BUY";
    else if (changePercent > 3) signal = "BUY";
    else if (changePercent < -10) signal = "SHORT";
    else if (changePercent < -3) signal = "SELL";
    else signal = "HOLD";

    return { timeFrame: tf, label, predictedPrice: predicted, confidence, changePercent, signal };
  });
}

export function getSignalColor(signal: Signal): string {
  switch (signal) {
    case "STRONG_BUY": return "text-gain";
    case "BUY": return "text-gain";
    case "HOLD": return "text-warn";
    case "SELL": return "text-loss";
    case "STRONG_SELL": return "text-loss";
    case "SHORT": return "text-signal-short";
  }
}

export function getSignalGlow(signal: Signal): string {
  switch (signal) {
    case "STRONG_BUY": case "BUY": return "glow-green";
    case "HOLD": return "";
    case "SELL": case "STRONG_SELL": return "glow-red";
    case "SHORT": return "glow-purple";
  }
}
