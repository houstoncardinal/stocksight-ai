export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface AnalysisResult {
  sma20: number[];
  sma50: number[];
  ema12: number[];
  ema26: number[];
  rsi: number[];
  macd: number[];
  macdSignal: number[];
  macdHistogram: number[];
  bollingerUpper: number[];
  bollingerMiddle: number[];
  bollingerLower: number[];
  atr: number[];
  stochK: number[];
  stochD: number[];
  obv: number[];
}

// Simple Moving Average
export function sma(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result[i] = sum / period;
  }
  return result;
}

// Exponential Moving Average
export function ema(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  const k = 2 / (period + 1);
  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  result[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

// RSI
export function rsi(data: number[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  if (gains.length < period) return result;

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    result[i + 1] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return result;
}

// MACD
export function macd(data: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = ema(data, 12);
  const ema26 = ema(data, 26);
  const macdLine: number[] = data.map((_, i) =>
    isNaN(ema12[i]) || isNaN(ema26[i]) ? NaN : ema12[i] - ema26[i]
  );
  const validMacd = macdLine.filter((v) => !isNaN(v));
  const signalEma = ema(validMacd, 9);
  const signal: number[] = new Array(data.length).fill(NaN);
  let idx = 0;
  for (let i = 0; i < data.length; i++) {
    if (!isNaN(macdLine[i])) {
      signal[i] = signalEma[idx] ?? NaN;
      idx++;
    }
  }
  const histogram = data.map((_, i) =>
    isNaN(macdLine[i]) || isNaN(signal[i]) ? NaN : macdLine[i] - signal[i]
  );
  return { macd: macdLine, signal, histogram };
}

// Bollinger Bands
export function bollingerBands(data: number[], period = 20, stdDev = 2) {
  const middle = sma(data, period);
  const upper: number[] = new Array(data.length).fill(NaN);
  const lower: number[] = new Array(data.length).fill(NaN);

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = middle[i];
    const variance = slice.reduce((sum, val) => sum + (val - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }
  return { upper, middle, lower };
}

// ATR
export function atr(data: StockDataPoint[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  const tr: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const h = data[i].high;
    const l = data[i].low;
    const pc = data[i - 1].close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }

  if (tr.length < period) return result;
  let atrVal = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period] = atrVal;

  for (let i = period; i < tr.length; i++) {
    atrVal = (atrVal * (period - 1) + tr[i]) / period;
    result[i + 1] = atrVal;
  }
  return result;
}

// Stochastic Oscillator
export function stochastic(data: StockDataPoint[], kPeriod = 14, dPeriod = 3) {
  const kValues: number[] = new Array(data.length).fill(NaN);
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...slice.map((d) => d.high));
    const lowest = Math.min(...slice.map((d) => d.low));
    kValues[i] = highest === lowest ? 50 : ((data[i].close - lowest) / (highest - lowest)) * 100;
  }
  const dValues = sma(
    kValues.map((v) => (isNaN(v) ? 0 : v)),
    dPeriod
  );
  return { k: kValues, d: dValues };
}

// On-Balance Volume
export function obv(data: StockDataPoint[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) result.push(result[i - 1] + data[i].volume);
    else if (data[i].close < data[i - 1].close) result.push(result[i - 1] - data[i].volume);
    else result.push(result[i - 1]);
  }
  return result;
}

// Run all analyses
export function analyzeData(data: StockDataPoint[]): AnalysisResult {
  const closes = data.map((d) => d.close);
  const macdResult = macd(closes);
  const bbResult = bollingerBands(closes);
  const stochResult = stochastic(data);

  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    ema12: ema(closes, 12),
    ema26: ema(closes, 26),
    rsi: rsi(closes),
    macd: macdResult.macd,
    macdSignal: macdResult.signal,
    macdHistogram: macdResult.histogram,
    bollingerUpper: bbResult.upper,
    bollingerMiddle: bbResult.middle,
    bollingerLower: bbResult.lower,
    atr: atr(data),
    stochK: stochResult.k,
    stochD: stochResult.d,
    obv: obv(data),
  };
}
