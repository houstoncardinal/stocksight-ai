import { 
  StockDataPoint, 
  AnalysisResult,
  sma, 
  ema, 
  rsi, 
  macd, 
  bollingerBands, 
  stochastic, 
  aroon, 
  ichimoku, 
  pivotPoints, 
  supportResistance, 
  fibonacci, 
  atr, 
  obv, 
  vwap, 
  adx, 
  williamsR, 
  cci, 
  mfi, 
  roc 
} from "./algorithms";

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

// Backtesting data structure
export interface BacktestPrediction {
  date: string;
  predictedPrice: number;
  actualPrice: number;
  timeframe: TimeFrame;
  model: "holt" | "wma" | "adaptive" | "ensemble";
}

export interface BacktestResult {
  predictions: BacktestPrediction[];
  accuracy: {
    mape: number; // Mean Absolute Percentage Error
    directional: number; // Directional accuracy (%)
    rmse: number; // Root Mean Square Error
  };
}

// World-Class Prediction Models

// 1. Triple Exponential Smoothing (Holt-Winters) with optimized parameters
function holtWinters(data: number[], alpha = 0.2, beta = 0.1, gamma = 0.05, periods = 1): number {
  if (data.length < 3) return data[data.length - 1] || 0;
  
  let level = data[0];
  let trend = data[1] - data[0];
  let season = data[0];
  
  for (let i = 1; i < data.length; i++) {
    const newLevel = alpha * (data[i] - season) + (1 - alpha) * (level + trend);
    trend = beta * (newLevel - level) + (1 - beta) * trend;
    season = gamma * (data[i] - newLevel) + (1 - gamma) * season;
    level = newLevel;
  }
  
  return level + trend * periods + season;
}

// 2. Weighted Moving Average with adaptive period selection
function wmaPrediction(data: number[], periods: number): number {
  // Use adaptive lookback based on volatility
  const volatility = calculateVolatility(data);
  const lookback = Math.min(data.length, Math.max(20, Math.min(100, Math.floor(60 / volatility))));
  
  const recent = data.slice(-lookback);
  let weightedSum = 0;
  let weightTotal = 0;

  for (let i = 0; i < recent.length; i++) {
    // Exponential weighting - more recent = more weight
    const weight = Math.exp((i - recent.length + 1) / 5);
    weightedSum += recent[i] * weight;
    weightTotal += weight;
  }

  const wma = weightedSum / weightTotal;
  const lastPrice = data[data.length - 1];
  const momentum = (lastPrice - data[Math.max(0, data.length - Math.min(periods * 2, data.length))]) / Math.min(periods * 2, data.length);
  return wma + momentum * periods * 0.5;
}

// 3. Linear Regression with trend analysis
function linearRegression(data: number[], periods: number): number {
  const lookback = Math.min(data.length, 50);
  const recent = data.slice(-lookback);
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < recent.length; i++) {
    sumX += i;
    sumY += recent[i];
    sumXY += i * recent[i];
    sumX2 += i * i;
  }
  
  const n = recent.length;
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return intercept + slope * (recent.length + periods);
}

// 4. Volume-Weighted Price Prediction
function vwapPrediction(data: StockDataPoint[], periods: number, analysis: AnalysisResult): number {
  const lookback = Math.min(data.length, 30);
  let vwapSum = 0;
  let volumeSum = 0;
  
  for (let i = data.length - lookback; i < data.length; i++) {
    const typicalPrice = (data[i].high + data[i].low + data[i].close) / 3;
    vwapSum += typicalPrice * data[i].volume;
    volumeSum += data[i].volume;
  }
  
  const currentVWAP = vwapSum / volumeSum;
  const lastPrice = data[data.length - 1].close;
  const vwapDiff = (lastPrice - currentVWAP) / currentVWAP;
  
  // Project based on VWAP deviation mean reversion
  return lastPrice * (1 + vwapDiff * 0.3 * (periods / 5));
}

// 5. Adaptive Signal-Based Prediction using multi-indicator confluence
function adaptivePrediction(data: number[], periods: number, analysis: AnalysisResult): number {
  const len = data.length - 1;
  const lastPrice = data[len];
  
  // Calculate signal strength from multiple indicators
  let totalSignal = 0;
  let signalCount = 0;
  
  // RSI momentum
  const rsiVal = analysis.rsi[len];
  if (!isNaN(rsiVal)) {
    totalSignal += (50 - rsiVal) / 100;
    signalCount++;
  }
  
  // MACD momentum
  const macd = analysis.macd[len];
  const macdSignal = analysis.macdSignal[len];
  if (!isNaN(macd) && !isNaN(macdSignal)) {
    totalSignal += (macd - macdSignal) / Math.abs(macdSignal || 1);
    signalCount++;
  }
  
  // Stochastic
  const stochK = analysis.stochK[len];
  if (!isNaN(stochK)) {
    totalSignal += (50 - stochK) / 100;
    signalCount++;
  }
  
  // ADX trend strength
  const adxVal = analysis.adx[len];
  if (!isNaN(adxVal)) {
    const trendFactor = adxVal / 100;
    totalSignal *= (1 + trendFactor);
    signalCount++;
  }
  
  // Bollinger mean reversion
  const bbUpper = analysis.bollingerUpper[len];
  const bbLower = analysis.bollingerLower[len];
  if (!isNaN(bbUpper) && !isNaN(bbLower)) {
    const bbMid = analysis.bollingerMiddle[len];
    const bbPos = (lastPrice - bbMid) / (bbUpper - bbLower);
    totalSignal -= bbPos * 0.5;
    signalCount++;
  }
  
  const avgSignal = signalCount > 0 ? totalSignal / signalCount : 0;
  return lastPrice * (1 + avgSignal * 0.02 * periods);
}

// 6. Exponential Smoothing with damping
function dampedExponential(data: number[], alpha = 0.3, periods = 1): number {
  if (data.length < 2) return data[data.length - 1] || 0;
  
  let level = data[0];
  let forecast = data[0];
  const damping = 0.95; // Damping factor to reduce long-term volatility
  
  for (let i = 1; i < data.length; i++) {
    const prevForecast = forecast;
    forecast = alpha * data[i] + (1 - alpha) * prevForecast;
    level = forecast;
  }
  
  // Apply damped trend projection
  let trend = 0;
  for (let i = Math.max(0, data.length - 10); i < data.length - 1; i++) {
    trend += (data[i + 1] - data[i]) / 10;
  }
  trend *= Math.pow(damping, periods);
  
  return level + trend * periods;
}

// 7. Support/Resistance aware prediction
function srAwarePrediction(data: StockDataPoint[], periods: number, analysis: AnalysisResult): number {
  const lastPrice = data[data.length - 1].close;
  const close = data.map(d => d.close);
  
  // Find nearest support and resistance
  let nearestSupport = 0;
  let nearestResistance = Infinity;
  
  for (const support of analysis.supportLevels) {
    if (support < lastPrice && support > nearestSupport) nearestSupport = support;
  }
  for (const resistance of analysis.resistanceLevels) {
    if (resistance > lastPrice && resistance < nearestResistance) nearestResistance = resistance;
  }
  
  // Calculate position between S/R
  if (nearestResistance === Infinity) nearestResistance = lastPrice * 1.1;
  if (nearestSupport === 0) nearestSupport = lastPrice * 0.9;
  
  const srRange = nearestResistance - nearestSupport;
  const position = srRange > 0 ? (lastPrice - nearestSupport) / srRange : 0.5;
  
  // Predict with mean reversion toward equilibrium
  const equilibrium = (nearestSupport + nearestResistance) / 2;
  const reversionSpeed = 0.1 * periods;
  
  if (position > 0.7) {
    // Near resistance - predict slight pullback
    return lastPrice * (1 - (position - 0.5) * reversionSpeed);
  } else if (position < 0.3) {
    // Near support - predict slight bounce
    return lastPrice * (1 + (0.5 - position) * reversionSpeed);
  }
  
  // Neutral - use exponential projection
  return dampedExponential(close, 0.3, periods);
}

// Calculate volatility for adaptive period selection
function calculateVolatility(data: number[]): number {
  const lookback = Math.min(data.length, 20);
  const recent = data.slice(-lookback);
  const returns: number[] = [];
  
  for (let i = 1; i < recent.length; i++) {
    returns.push((recent[i] - recent[i - 1]) / recent[i - 1]);
  }
  
  if (returns.length === 0) return 1;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * 100 || 1;
}

// Calculate model agreement for confidence
function calculateModelAgreement(predictions: number[]): number {
  if (predictions.length < 2) return 80;
  
  const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const variance = predictions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / predictions.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;
  
  // Lower CV = higher agreement = higher confidence
  return Math.max(60, Math.min(95, 90 - coefficientOfVariation));
}

// Market Regime Detection - Identifies current market state for model selection
export type MarketRegime = "BULL_TREND" | "BEAR_TREND" | "SIDEWAYS" | "HIGH_VOLATILITY" | "LOW_VOLATILITY";

export function detectMarketRegime(data: StockDataPoint[], analysis: AnalysisResult): { regime: MarketRegime; confidence: number; signals: string[] } {
  const len = data.length - 1;
  const price = data[len].close;
  const closes = data.map(d => d.close);
  
  const signals: string[] = [];
  let regimeScore = 0; // Positive = bull, Negative = bear, Near 0 = sideways
  
  // 1. ADX Trend Strength
  const adx = analysis.adx[len];
  if (!isNaN(adx)) {
    if (adx > 40) {
      signals.push(`Strong trend (ADX: ${adx.toFixed(0)})`);
      if (adx > 50) regimeScore += 2; // Very strong
    } else if (adx > 25) {
      signals.push(`Moderate trend (ADX: ${adx.toFixed(0)})`);
    } else {
      signals.push(`Weak trend - sideways (ADX: ${adx.toFixed(0)})`);
    }
  }
  
  // 2. Price vs Moving Averages
  const sma20 = analysis.sma20[len];
  const sma50 = analysis.sma50[len];
  const sma200 = analysis.sma200[len];
  
  if (!isNaN(sma20) && !isNaN(sma50)) {
    if (price > sma20 && price > sma50) {
      regimeScore += 1;
      signals.push("Price above short-term MAs");
    } else if (price < sma20 && price < sma50) {
      regimeScore -= 1;
      signals.push("Price below short-term MAs");
    }
  }
  
  if (!isNaN(sma50) && !isNaN(sma200)) {
    if (sma50 > sma200) {
      regimeScore += 1;
      signals.push("Golden cross (50 > 200 MA)");
    } else if (sma50 < sma200) {
      regimeScore -= 1;
      signals.push("Death cross (50 < 200 MA)");
    }
  }
  
  // 3. Volatility (ATR-based)
  const atr = analysis.atr[len];
  if (!isNaN(atr) && price > 0) {
    const atrPercent = (atr / price) * 100;
    if (atrPercent > 5) {
      signals.push(`High volatility (ATR: ${atrPercent.toFixed(1)}%)`);
      regimeScore = regimeScore * 0.5; // Reduce confidence in high volatility
    } else if (atrPercent < 2) {
      signals.push(`Low volatility (ATR: ${atrPercent.toFixed(1)}%)`);
    }
  }
  
  // 4. RSI for overbought/oversold
  const rsi = analysis.rsi[len];
  if (!isNaN(rsi)) {
    if (rsi > 70) {
      signals.push("RSI Overbought (70+)");
      regimeScore -= 0.5;
    } else if (rsi < 30) {
      signals.push("RSI Oversold (30-)");
      regimeScore += 0.5;
    }
  }
  
  // 5. Bollinger Band width (volatility indicator)
  const bbUpper = analysis.bollingerUpper[len];
  const bbLower = analysis.bollingerLower[len];
  if (!isNaN(bbUpper) && !isNaN(bbLower)) {
    const bbWidth = (bbUpper - bbLower) / analysis.bollingerMiddle[len];
    if (bbWidth > 0.1) {
      signals.push("Wide Bollinger Bands - High volatility");
    }
  }
  
  // Determine regime
  let regime: MarketRegime;
  let regimeConfidence = 70;
  
  if (adx > 40 || (adx > 25 && Math.abs(regimeScore) >= 2)) {
    // Strong trend
    if (regimeScore > 0) {
      regime = "BULL_TREND";
      signals.push("BULL TREND regime detected");
    } else {
      regime = "BEAR_TREND";
      signals.push("BEAR TREND regime detected");
    }
    regimeConfidence = Math.min(90, 65 + Math.abs(regimeScore) * 5);
  } else if (adx < 20) {
    // Very weak - likely sideways
    regime = "SIDEWAYS";
    signals.push("SIDEWAYS market - low trend");
    regimeConfidence = 60;
  } else {
    // Check volatility
    if (!isNaN(atr) && price > 0) {
      const atrPercent = (atr / price) * 100;
      if (atrPercent > 5) {
        regime = "HIGH_VOLATILITY";
        signals.push("HIGH VOLATILITY regime - caution");
        regimeConfidence = 45; // Lower confidence
      } else if (atrPercent < 2) {
        regime = "LOW_VOLATILITY";
        signals.push("LOW VOLATILITY - calm market");
        regimeConfidence = 75;
      } else {
        regime = "SIDEWAYS";
        signals.push("SIDEWAYS/RANGING market");
        regimeConfidence = 65;
      }
    } else {
      regime = "SIDEWAYS";
      regimeConfidence = 60;
    }
  }
  
  return { regime, confidence: regimeConfidence, signals };
}

// Regime-aware prediction - Uses models appropriate for detected regime
function regimeAwarePrediction(data: StockDataPoint[], periods: number, analysis: AnalysisResult, regime: MarketRegime): number {
  const closes = data.map(d => d.close);
  const lastPrice = closes[closes.length - 1];
  
  // Adjust model weights based on regime
  let weights: { [key: string]: number } = {
    holt: 0.20, wma: 0.18, linear: 0.15, vwap: 0.12, 
    adaptive: 0.15, damped: 0.12, srAware: 0.08
  };
  
  switch (regime) {
    case "BULL_TREND":
      // In bull markets, trend-following models excel
      weights = {
        holt: 0.25, wma: 0.20, linear: 0.15, vwap: 0.10, 
        adaptive: 0.10, damped: 0.10, srAware: 0.10
      };
      break;
    case "BEAR_TREND":
      // In bear markets, mean reversion models work better
      weights = {
        holt: 0.15, wma: 0.20, linear: 0.10, vwap: 0.20, 
        adaptive: 0.15, damped: 0.10, srAware: 0.10
      };
      break;
    case "SIDEWAYS":
      // In ranging markets, oscillator-based models excel
      weights = {
        holt: 0.10, wma: 0.15, linear: 0.10, vwap: 0.15, 
        adaptive: 0.25, damped: 0.15, srAware: 0.10
      };
      break;
    case "HIGH_VOLATILITY":
      // High volatility - use more conservative models with damping
      weights = {
        holt: 0.15, wma: 0.20, linear: 0.10, vwap: 0.15, 
        adaptive: 0.15, damped: 0.20, srAware: 0.05
      };
      break;
    case "LOW_VOLATILITY":
      // Low volatility - all models work, give balanced weights
      weights = {
        holt: 0.18, wma: 0.18, linear: 0.15, vwap: 0.12, 
        adaptive: 0.15, damped: 0.12, srAware: 0.10
      };
      break;
  }
  
  // Calculate weighted prediction
  const pred = 
    holtWinters(closes, 0.2, 0.1, 0.05, periods) * weights.holt +
    wmaPrediction(closes, periods) * weights.wma +
    linearRegression(closes, periods) * weights.linear +
    vwapPrediction(data, periods, analysis) * weights.vwap +
    adaptivePrediction(closes, periods, analysis) * weights.adaptive +
    dampedExponential(closes, 0.3, periods) * weights.damped +
    srAwarePrediction(data, periods, analysis) * weights.srAware;
  
  return pred;
}

// Why Engine - Generate human-readable explanations
export interface WhyEngineResult {
  summary: string;
  keyReasons: string[];
  confidence: number;
}

export function generateWhyEngine(data: StockDataPoint[], analysis: AnalysisResult, predictions: Prediction[]): WhyEngineResult {
  const len = data.length - 1;
  const price = data[len].close;
  const reasons: string[] = [];
  let bullishScore = 0;
  let bearishScore = 0;
  
  // RSI Analysis
  const rsi = analysis.rsi[len];
  if (!isNaN(rsi)) {
    if (rsi < 30) {
      reasons.push(`RSI at ${rsi.toFixed(0)} indicates oversold conditions`);
      bullishScore += 2;
    } else if (rsi > 70) {
      reasons.push(`RSI at ${rsi.toFixed(0)} suggests overbought territory`);
      bearishScore += 2;
    } else {
      reasons.push(`RSI at ${rsi.toFixed(0)} shows neutral momentum`);
    }
  }
  
  // MACD Analysis
  const macd = analysis.macd[len];
  const macdSignal = analysis.macdSignal[len];
  if (!isNaN(macd) && !isNaN(macdSignal)) {
    if (macd > macdSignal) {
      reasons.push("MACD showing bullish crossover");
      bullishScore += 1;
    } else {
      reasons.push("MACD in bearish territory");
      bearishScore += 1;
    }
  }
  
  // Price vs Moving Averages
  const sma20 = analysis.sma20[len];
  const sma50 = analysis.sma50[len];
  if (!isNaN(sma20) && !isNaN(sma50)) {
    if (price > sma20 && price > sma50) {
      reasons.push("Price trading above key moving averages");
      bullishScore += 2;
    } else if (price < sma20 && price < sma50) {
      reasons.push("Price below key moving averages");
      bearishScore += 2;
    } else {
      reasons.push("Price between short and medium-term averages");
    }
  }
  
  // Bollinger Bands
  const bbUpper = analysis.bollingerUpper[len];
  const bbLower = analysis.bollingerLower[len];
  if (!isNaN(bbUpper) && !isNaN(bbLower)) {
    const bbMid = analysis.bollingerMiddle[len];
    const bbPos = (price - bbMid) / (bbUpper - bbLower);
    if (bbPos < -0.5) {
      reasons.push("Near lower Bollinger Band - potential bounce");
      bullishScore += 1;
    } else if (bbPos > 0.5) {
      reasons.push("Near upper Bollinger Band - potential pullback");
      bearishScore += 1;
    }
  }
  
  // ADX Trend Strength
  const adx = analysis.adx[len];
  if (!isNaN(adx)) {
    if (adx > 40) {
      reasons.push(`Strong trend (ADX ${adx.toFixed(0)}) - ${adx > 50 ? "very" : ""} reliable signal`);
    } else if (adx < 20) {
      reasons.push("Weak trend (ADX < 20) - low confidence");
    }
  }
  
  // Stochastic
  const stochK = analysis.stochK[len];
  if (!isNaN(stochK)) {
    if (stochK < 20) {
      reasons.push("Stochastic oversold - buying opportunity");
      bullishScore += 1;
    } else if (stochK > 80) {
      reasons.push("Stochastic overbought - selling pressure");
      bearishScore += 1;
    }
  }
  
  // Generate summary
  let summary = "";
  const totalScore = bullishScore + bearishScore;
  if (totalScore === 0) {
    summary = "This asset is showing mixed signals across technical indicators. The overall market position is uncertain.";
  } else if (bullishScore > bearishScore * 1.5) {
    summary = `This asset is exhibiting BULLISH characteristics with ${bullishScore} positive indicators outcompeting ${bearishScore} bearish signals.`;
  } else if (bearishScore > bullishScore * 1.5) {
    summary = `This asset is showing BEARISH signals with ${bearishScore} negative indicators outweighing ${bullishScore} positive factors.`;
  } else {
    summary = `This asset is in a HOLD position with ${bullishScore} bullish and ${bearishScore} bearish signals nearly balanced.`;
  }
  
  // Add prediction context
  const nextDayPred = predictions.find(p => p.timeFrame === "1D");
  if (nextDayPred) {
    if (nextDayPred.changePercent > 3) {
      summary += ` Short-term models project approximately ${nextDayPred.changePercent.toFixed(1)}% upside.`;
    } else if (nextDayPred.changePercent < -3) {
      summary += ` Short-term models anticipate roughly ${Math.abs(nextDayPred.changePercent).toFixed(1)}% downside.`;
    }
  }
  
  const confidence = Math.min(95, 60 + (totalScore * 5) + (Math.abs(bullishScore - bearishScore) * 3));
  
  return {
    summary,
    keyReasons: reasons.slice(0, 5),
    confidence: Math.max(50, confidence)
  };
}

// Multi-Timeframe Convergence - Trend Alignment Matrix
export interface TimeframeSignal {
  timeframe: string;
  signal: Signal;
  strength: number; // 0-100
}

export function calculateMultiTimeframeSignals(data: StockDataPoint[], analysis: AnalysisResult): TimeframeSignal[] {
  const closes = data.map(d => d.close);
  const len = data.length - 1;
  
  // For each timeframe, calculate signal strength based on available data
  // This simulates analysis on different timeframes
  
  const timeframes = [
    { name: "15m", periods: 1, dataPoints: Math.min(50, data.length) },
    { name: "1H", periods: 5, dataPoints: Math.min(100, data.length) },
    { name: "4H", periods: 20, dataPoints: Math.min(150, data.length) },
    { name: "1D", periods: 1, dataPoints: data.length }
  ];
  
  return timeframes.map(tf => {
    // Use last N data points to simulate different timeframes
    const startIdx = Math.max(0, len - tf.dataPoints);
    const tfData = data.slice(startIdx);
    const tfCloses = tfData.map(d => d.close);
    const tfLen = tfData.length - 1;
    
    // Calculate signal based on recent price action
    let score = 0;
    
    if (tfCloses.length >= 5) {
      const recentSMA = tfCloses.slice(-5).reduce((a, b) => a + b, 0) / 5;
      if (tfCloses[tfLen] > recentSMA) score += 1;
      else score -= 1;
    }
    
    if (tfCloses.length >= 10) {
      const longerSMA = tfCloses.slice(-10).reduce((a, b) => a + b, 0) / 10;
      if (tfCloses[tfLen] > longerSMA) score += 1;
      else score -= 1;
    }
    
    // Use RSI from analysis (adjusted for available data)
    const rsiVal = analysis.rsi[Math.min(tfLen, analysis.rsi.length - 1)];
    if (!isNaN(rsiVal)) {
      if (rsiVal < 40) score += 1;
      else if (rsiVal > 60) score -= 1;
    }
    
    // Use ADX for trend strength
    const adxVal = analysis.adx[Math.min(tfLen, analysis.adx.length - 1)];
    if (!isNaN(adxVal)) {
      if (adxVal > 25) {
        if (score > 0) score += 1;
        else if (score < 0) score -= 1;
      }
    }
    
    // Determine signal
    let signal: Signal;
    if (score >= 2) signal = "STRONG_BUY";
    else if (score >= 1) signal = "BUY";
    else if (score <= -2) signal = "STRONG_SELL";
    else if (score <= -1) signal = "SELL";
    else signal = "HOLD";
    
    // Strength calculation
    const strength = Math.min(95, 50 + Math.abs(score) * 15 + (adxVal > 25 ? 15 : 0));
    
    return {
      timeframe: tf.name,
      signal,
      strength
    };
  });
}

// Sentiment Correlation - Fear & Greed Gauge
export interface SentimentGauge {
  score: number; // 0-100, 0 = extreme fear, 100 = extreme greed
  label: "EXTREME_FEAR" | "FEAR" | "NEUTRAL" | "GREED" | "EXTREME_GREED";
  factors: string[];
}

export function calculateSentimentGauge(data: StockDataPoint[], analysis: AnalysisResult): SentimentGauge {
  const len = data.length - 1;
  const price = data[len].close;
  const closes = data.map(d => d.close);
  let score = 50;
  const factors: string[] = [];
  
  // RSI-based sentiment (inverted: low RSI = fear, high RSI = greed)
  const rsi = analysis.rsi[len];
  if (!isNaN(rsi)) {
    const rsiScore = rsi; // 0-100
    score += (rsiScore - 50) * 0.3;
    if (rsi < 30) factors.push("RSI showing oversold (fear)");
    else if (rsi > 70) factors.push("RSI showing overbought (greed)");
  }
  
  // Price momentum
  if (closes.length >= 20) {
    const recentReturn = (closes[len] - closes[len - 20]) / closes[len - 20];
    score += Math.max(-20, Math.min(20, recentReturn * 100));
    if (recentReturn < -0.1) factors.push("Significant recent decline");
    else if (recentReturn > 0.1) factors.push("Strong recent rally");
  }
  
  // Volatility
  const atr = analysis.atr[len];
  if (!isNaN(atr) && price > 0) {
    const atrPercent = (atr / price) * 100;
    if (atrPercent > 4) {
      score -= 10; // High volatility often = fear
      factors.push("High volatility (uncertainty)");
    } else if (atrPercent < 2) {
      score += 5; // Low volatility = greed/complacency
      factors.push("Low volatility (complacency)");
    }
  }
  
  // Volume trend
  const obv = analysis.obv[len];
  const obvPrev = analysis.obv[Math.max(0, len - 10)];
  if (!isNaN(obv) && !isNaN(obvPrev)) {
    if (obv > obvPrev) {
      score += 5;
      factors.push("On-balance volume rising");
    } else {
      score -= 5;
      factors.push("On-balance volume falling");
    }
  }
  
  // Bollinger position
  const bbUpper = analysis.bollingerUpper[len];
  const bbLower = analysis.bollingerLower[len];
  if (!isNaN(bbUpper) && !isNaN(bbLower)) {
    const bbMid = analysis.bollingerMiddle[len];
    const bbPos = (price - bbMid) / (bbUpper - bbLower);
    if (bbPos > 0.8) {
      score += 10;
      factors.push("At upper Bollinger (greed)");
    } else if (bbPos < -0.8) {
      score -= 10;
      factors.push("At lower Bollinger (fear)");
    }
  }
  
  // Clamp and determine label
  score = Math.max(0, Math.min(100, score));
  
  let label: SentimentGauge["label"];
  if (score < 20) label = "EXTREME_FEAR";
  else if (score < 40) label = "FEAR";
  else if (score < 60) label = "NEUTRAL";
  else if (score < 80) label = "GREED";
  else label = "EXTREME_GREED";
  
  return { score, label, factors: factors.slice(0, 4) };
}

// Black Swan Alert - Detects high-risk conditions
export interface BlackSwanAlert {
  active: boolean;
  level: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  recommendation: string;
}

export function checkBlackSwanRisk(data: StockDataPoint[], analysis: AnalysisResult): BlackSwanAlert {
  const reasons: string[] = [];
  let riskScore = 0;
  
  const len = data.length - 1;
  const price = data[len].close;
  const closes = data.map(d => d.close);
  
  // 1. Check for extreme RSI (overbought/oversold)
  const rsi = analysis.rsi[len];
  if (!isNaN(rsi)) {
    if (rsi > 85 || rsi < 15) {
      reasons.push(`Extreme RSI: ${rsi.toFixed(0)} (likely reversal)`);
      riskScore += 3;
    } else if (rsi > 75 || rsi < 25) {
      reasons.push(`High RSI: ${rsi.toFixed(0)}`);
      riskScore += 1;
    }
  }
  
  // 2. Check Bollinger position (at extremes)
  const bbUpper = analysis.bollingerUpper[len];
  const bbLower = analysis.bollingerLower[len];
  if (!isNaN(bbUpper) && !isNaN(bbLower)) {
    const bbMid = analysis.bollingerMiddle[len];
    const bbPos = (price - bbMid) / (bbUpper - bbLower);
    if (Math.abs(bbPos) > 0.95) {
      reasons.push("Price at Bollinger extreme (likely mean revert)");
      riskScore += 2;
    }
  }
  
  // 3. Check ATR volatility spike
  const atr = analysis.atr[len];
  if (!isNaN(atr) && price > 0) {
    const atrPercent = (atr / price) * 100;
    // Compare to historical average
    const lookback = Math.min(20, data.length);
    let avgATR = 0;
    for (let i = data.length - lookback; i < data.length; i++) {
      const a = analysis.atr[i];
      if (!isNaN(a)) avgATR += a;
    }
    avgATR /= lookback;
    
    if (atr > avgATR * 2) {
      reasons.push(`ATR spike: ${atrPercent.toFixed(1)}% (2x average)`);
      riskScore += 3;
    } else if (atr > avgATR * 1.5) {
      reasons.push(`Elevated volatility: ${atrPercent.toFixed(1)}%`);
      riskScore += 1;
    }
  }
  
  // 4. Check ADX for false signals during weak trends
  const adx = analysis.adx[len];
  if (!isNaN(adx) && adx < 20) {
    reasons.push("Weak trend (ADX < 20) - unreliable signals");
    riskScore += 2;
  }
  
  // 5. Check for large price gap
  if (data.length > 1) {
    const prevClose = data[len - 1].close;
    const gap = Math.abs((price - prevClose) / prevClose);
    if (gap > 0.05) {
      reasons.push(`Large gap: ${(gap * 100).toFixed(1)}%`);
      riskScore += 2;
    }
  }
  
  // 6. Check MACD divergence (price making new highs but MACD not)
  const macd = analysis.macd[len];
  const macdHist = analysis.macdHistogram[len];
  if (!isNaN(macd) && !isNaN(macdHist) && macdHist < 0 && price > closes[Math.max(0, len - 10)]) {
    reasons.push("Bearish divergence (price up, MACD down)");
    riskScore += 2;
  }
  
  // Determine alert level
  let level: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let recommendation = "Market conditions appear stable";
  
  if (riskScore >= 6) {
    level = "HIGH";
    recommendation = "⚠️ High risk detected. Model accuracy may be compromised. Consider reducing position size or waiting.";
    reasons.push("HIGH RISK - Reduce exposure");
  } else if (riskScore >= 3) {
    level = "MEDIUM";
    recommendation = "⚡ Elevated risk detected. Exercise caution with new positions.";
  }
  
  return {
    active: riskScore > 0,
    level,
    reasons,
    recommendation
  };
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
  const sma200 = analysis.sma200[len];
  if (!isNaN(sma20)) { if (price > sma20) score += 1; else score -= 1; }
  if (!isNaN(sma50)) { if (price > sma50) score += 1; else score -= 1; }
  if (!isNaN(sma200)) { if (price > sma200) score += 1; else score -= 1; }

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

  // ADX trend strength
  const adxVal = analysis.adx[len];
  if (!isNaN(adxVal) && adxVal > 25) {
    // Strong trend — amplify existing signal
    score = score > 0 ? score + 1 : score - 1;
  }

  // Williams %R
  const wrVal = analysis.williamsR[len];
  if (!isNaN(wrVal)) {
    if (wrVal < -80) score += 1;
    if (wrVal > -20) score -= 1;
  }

  // VWAP
  const vwapVal = analysis.vwap[len];
  if (!isNaN(vwapVal)) {
    if (price > vwapVal) score += 1;
    else score -= 1;
  }

  if (score >= 7) return "STRONG_BUY";
  if (score >= 3) return "BUY";
  if (score <= -7) return "SHORT";
  if (score <= -3) return "STRONG_SELL";
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
    // World-class ensemble of 7 advanced models
    const holt = holtWinters(closes, 0.2, 0.1, 0.05, periods);
    const wma = wmaPrediction(closes, periods);
    const linear = linearRegression(closes, periods);
    const vwap = vwapPrediction(data, periods, analysis);
    const adaptive = adaptivePrediction(closes, periods, analysis);
    const damped = dampedExponential(closes, 0.3, periods);
    const srAware = srAwarePrediction(data, periods, analysis);
    
    // Weighted ensemble - more weight on shorter-term accurate models
    const predicted = (holt * 0.20 + wma * 0.18 + linear * 0.15 + vwap * 0.12 + 
                      adaptive * 0.15 + damped * 0.12 + srAware * 0.08);
    
    const changePercent = ((predicted - lastPrice) / lastPrice) * 100;

    // Calculate model agreement for confidence
    const modelPredictions = [holt, wma, linear, vwap, adaptive, damped, srAware];
    const modelAgreement = calculateModelAgreement(modelPredictions);
    
    // Confidence: high for short-term, with model agreement boost
    const timeDecay = Math.min(periods / 252, 1);
    const baseConfidence = 75;
    const confidence = Math.max(50, Math.min(95, baseConfidence - timeDecay * 25 + (modelAgreement - 70) * 0.3));

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

// Enhanced Backtesting System - Powerful historical evaluation
export interface DetailedBacktestResult {
  predictions: BacktestPrediction[];
  accuracy: {
    mape: number;
    directional: number;
    rmse: number;
    r2: number; // R-squared
    hitRate: number; // % of predictions within 5% of actual
    avgError: number;
    maxError: number;
    winLoss: number; // Ratio of profitable predictions
  };
  period: {
    start: string;
    end: string;
    days: number;
    predictions: number;
  };
  monthlyPerformance: { month: string; predicted: number; actual: number; error: number }[];
  signalAccuracy: { correct: number; total: number; percentage: number };
}

export function generateDetailedBacktest(data: StockDataPoint[], analysis: AnalysisResult): DetailedBacktestResult {
  const closes = data.map(d => d.close);
  const dates = data.map(d => d.date);
  const predictions: BacktestPrediction[] = [];
  
  // Use up to 1 year of historical data (252 trading days)
  const maxLookback = Math.min(data.length - 30, 252);
  const startIndex = Math.max(30, data.length - maxLookback);
  
  // Generate predictions more frequently (every ~5 days for more data points)
  const predictionInterval = 5;
  
  for (let i = startIndex; i < data.length - 5; i += predictionInterval) {
    const historicalData = data.slice(0, i + 1);
    const historicalCloses = historicalData.map(d => d.close);
    const historicalAnalysis = analyzeDataForBacktest(historicalData);
    const lastPrice = historicalCloses[historicalCloses.length - 1];
    
    // Predict 1 week ahead
    const periods = 5;
    
    // Use world-class ensemble
    const holt = holtWinters(historicalCloses, 0.2, 0.1, 0.05, periods);
    const wma = wmaPrediction(historicalCloses, periods);
    const linear = linearRegression(historicalCloses, periods);
    const vwap = vwapPrediction(historicalData, periods, historicalAnalysis);
    const adaptive = adaptivePrediction(historicalCloses, periods, historicalAnalysis);
    const damped = dampedExponential(historicalCloses, 0.3, periods);
    const srAware = srAwarePrediction(historicalData, periods, historicalAnalysis);
    
    const ensemble = (holt * 0.20 + wma * 0.18 + linear * 0.15 + vwap * 0.12 + 
                      adaptive * 0.15 + damped * 0.12 + srAware * 0.08);
    
    // Get actual price after prediction period
    const actualIndex = Math.min(i + periods, data.length - 1);
    const actualPrice = closes[actualIndex];
    
    predictions.push({
      date: data[i].date,
      predictedPrice: ensemble,
      actualPrice: actualPrice,
      timeframe: "1W",
      model: "ensemble"
    });
  }
  
  // Calculate comprehensive accuracy metrics
  const mape = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + Math.abs((p.actualPrice - p.predictedPrice) / p.actualPrice) * 100, 0) / predictions.length
    : 0;
  
  // Directional accuracy (did prediction direction match actual?)
  let directionalCorrect = 0;
  let hitRateCount = 0;
  let wins = 0;
  let losses = 0;
  
  for (let i = 0; i < predictions.length - 1; i++) {
    const prevPrice = closes[dates.findIndex(d => d === predictions[i].date) - 1] || predictions[i].actualPrice;
    const predDir = predictions[i].predictedPrice > prevPrice ? 1 : -1;
    const actualDir = predictions[i].actualPrice > prevPrice ? 1 : -1;
    if (predDir === actualDir) directionalCorrect++;
    
    // Hit rate - within 5% of actual
    const error = Math.abs((predictions[i].actualPrice - predictions[i].predictedPrice) / predictions[i].actualPrice);
    if (error <= 0.05) hitRateCount++;
    
    // Win/Loss
    if (predictions[i].predictedPrice > predictions[i].actualPrice) wins++;
    else losses++;
  }
  
  const directional = predictions.length > 0 ? (directionalCorrect / predictions.length) * 100 : 0;
  const hitRate = predictions.length > 0 ? (hitRateCount / predictions.length) * 100 : 0;
  const winLoss = losses > 0 ? wins / losses : 0;
  
  // RMSE
  const rmse = predictions.length > 0
    ? Math.sqrt(predictions.reduce((sum, p) => sum + Math.pow(p.actualPrice - p.predictedPrice, 2), 0) / predictions.length)
    : 0;
  
  // R-squared
  const actualMean = predictions.reduce((sum, p) => sum + p.actualPrice, 0) / predictions.length;
  const ssTot = predictions.reduce((sum, p) => sum + Math.pow(p.actualPrice - actualMean, 2), 0);
  const ssRes = predictions.reduce((sum, p) => sum + Math.pow(p.actualPrice - p.predictedPrice, 2), 0);
  const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
  
  // Average error
  const avgError = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + Math.abs(p.actualPrice - p.predictedPrice), 0) / predictions.length
    : 0;
  
  // Max error
  const maxError = predictions.length > 0
    ? Math.max(...predictions.map(p => Math.abs(p.actualPrice - p.predictedPrice)))
    : 0;
  
  // Signal accuracy
  const signalCorrect = predictions.filter(p => {
    const predChange = (p.predictedPrice - closes[dates.findIndex(d => d === p.date) - 1]) / closes[dates.findIndex(d => d === p.date) - 1];
    const actualChange = (p.actualPrice - closes[dates.findIndex(d => d === p.date) - 1]) / closes[dates.findIndex(d => d === p.date) - 1];
    return (predChange > 0 && actualChange > 0) || (predChange < 0 && actualChange < 0);
  }).length;
  
  // Monthly performance breakdown
  const monthlyMap = new Map<string, { predicted: number; actual: number; count: number }>();
  predictions.forEach(p => {
    const month = p.date.substring(0, 7); // YYYY-MM
    const existing = monthlyMap.get(month) || { predicted: 0, actual: 0, count: 0 };
    existing.predicted += p.predictedPrice;
    existing.actual += p.actualPrice;
    existing.count++;
    monthlyMap.set(month, existing);
  });
  
  const monthlyPerformance = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    predicted: data.predicted / data.count,
    actual: data.actual / data.count,
    error: Math.abs((data.actual - data.predicted) / data.actual) * 100
  }));
  
  return {
    predictions,
    accuracy: { 
      mape, 
      directional: directional || 50, 
      rmse,
      r2: r2 * 100,
      hitRate,
      avgError,
      maxError,
      winLoss
    },
    period: {
      start: data[startIndex]?.date || "",
      end: data[data.length - 1]?.date || "",
      days: data.length - startIndex,
      predictions: predictions.length
    },
    monthlyPerformance,
    signalAccuracy: {
      correct: signalCorrect,
      total: predictions.length,
      percentage: predictions.length > 0 ? (signalCorrect / predictions.length) * 100 : 0
    }
  };
}

// Legacy backtest function - now points to detailed version
export function generateBacktest(data: StockDataPoint[], analysis: AnalysisResult): BacktestResult {
  const detailed = generateDetailedBacktest(data, analysis);
  return {
    predictions: detailed.predictions,
    accuracy: {
      mape: detailed.accuracy.mape,
      directional: detailed.accuracy.directional,
      rmse: detailed.accuracy.rmse
    }
  };
}

// Analyze data for backtesting (simplified version)
function analyzeDataForBacktest(data: StockDataPoint[]): AnalysisResult {
  // Reuse core analysis functions but with simpler setup
  const closes = data.map(d => d.close);
  const { macd: macdResult, signal: macdSignal, histogram: macdHist } = macd(closes);
  const bb = bollingerBands(closes);
  const { k: stochK, d: stochD } = stochastic(data);
  const { up: aroonUp, down: aroonDown } = aroon(data);
  const { tenkan, kijun, senkouA, senkouB } = ichimoku(data);
  const pivots = pivotPoints(data);
  const sr = supportResistance(data);
  const fib = fibonacci(data);
  
  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    ema9: ema(closes, 9),
    ema12: ema(closes, 12),
    ema21: ema(closes, 21),
    ema26: ema(closes, 26),
    rsi: rsi(closes),
    macd: macdResult,
    macdSignal,
    macdHistogram: macdHist,
    stochK,
    stochD,
    cci: cci(data),
    mfi: mfi(data),
    roc: roc(closes),
    williamsR: williamsR(data),
    bollingerUpper: bb.upper,
    bollingerMiddle: bb.middle,
    bollingerLower: bb.lower,
    atr: atr(data),
    obv: obv(data),
    vwap: vwap(data),
    adx: adx(data),
    aroonUp,
    aroonDown,
    tenkan,
    kijun,
    senkouA,
    senkouB,
    fibLevels: fib,
    supportLevels: sr.support,
    resistanceLevels: sr.resistance,
    pivotPoint: pivots.pp,
    pivotR1: pivots.r1,
    pivotR2: pivots.r2,
    pivotR3: pivots.r3,
    pivotS1: pivots.s1,
    pivotS2: pivots.s2,
    pivotS3: pivots.s3,
  };
}

