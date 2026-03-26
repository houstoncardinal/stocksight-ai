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
  sma200: number[];
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
  vwap: number[];
  adx: number[];
  williamsR: number[];
  fibLevels: FibonacciLevels;
  supportLevels: number[];
  resistanceLevels: number[];
}

export interface FibonacciLevels {
  high: number;
  low: number;
  levels: { ratio: number; label: string; price: number }[];
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

// VWAP (Volume Weighted Average Price) — cumulative
export function vwap(data: StockDataPoint[]): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  let cumTPV = 0;
  let cumVol = 0;
  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3;
    cumTPV += tp * data[i].volume;
    cumVol += data[i].volume;
    result[i] = cumVol === 0 ? NaN : cumTPV / cumVol;
  }
  return result;
}

// ADX (Average Directional Index)
export function adx(data: StockDataPoint[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period + 1) return result;

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const trArr: number[] = [];

  for (let i = 1; i < data.length; i++) {
    const upMove = data[i].high - data[i - 1].high;
    const downMove = data[i - 1].low - data[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const h = data[i].high, l = data[i].low, pc = data[i - 1].close;
    trArr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }

  if (trArr.length < period) return result;

  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothTR = trArr.slice(0, period).reduce((a, b) => a + b, 0);

  const dxArr: number[] = [];

  for (let i = period; i < trArr.length; i++) {
    if (i > period) {
      smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
      smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];
      smoothTR = smoothTR - smoothTR / period + trArr[i];
    }
    const plusDI = smoothTR === 0 ? 0 : (smoothPlusDM / smoothTR) * 100;
    const minusDI = smoothTR === 0 ? 0 : (smoothMinusDM / smoothTR) * 100;
    const diSum = plusDI + minusDI;
    const dx = diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
    dxArr.push(dx);
  }

  if (dxArr.length < period) return result;

  let adxVal = dxArr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period * 2] = adxVal;

  for (let i = period; i < dxArr.length; i++) {
    adxVal = (adxVal * (period - 1) + dxArr[i]) / period;
    const idx = i + period + 1;
    if (idx < result.length) result[idx] = adxVal;
  }

  return result;
}

// Williams %R
export function williamsR(data: StockDataPoint[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map((d) => d.high));
    const lowest = Math.min(...slice.map((d) => d.low));
    result[i] = highest === lowest ? -50 : ((highest - data[i].close) / (highest - lowest)) * -100;
  }
  return result;
}

// Fibonacci Retracement Levels
export function fibonacci(data: StockDataPoint[]): FibonacciLevels {
  const recent = data.slice(-120);
  const high = Math.max(...recent.map((d) => d.high));
  const low = Math.min(...recent.map((d) => d.low));
  const diff = high - low;

  const ratios = [
    { ratio: 0, label: "0% (Low)" },
    { ratio: 0.236, label: "23.6%" },
    { ratio: 0.382, label: "38.2%" },
    { ratio: 0.5, label: "50.0%" },
    { ratio: 0.618, label: "61.8%" },
    { ratio: 0.786, label: "78.6%" },
    { ratio: 1, label: "100% (High)" },
  ];

  return {
    high,
    low,
    levels: ratios.map((r) => ({ ...r, price: low + diff * r.ratio })),
  };
}

// Support and Resistance detection via pivot points
export function supportResistance(data: StockDataPoint[], lookback = 20): { support: number[]; resistance: number[] } {
  const support: number[] = [];
  const resistance: number[] = [];
  const recent = data.slice(-Math.min(data.length, 252));

  for (let i = lookback; i < recent.length - lookback; i++) {
    const isResistance = recent.slice(i - lookback, i + lookback + 1).every((d) => d.high <= recent[i].high);
    const isSupport = recent.slice(i - lookback, i + lookback + 1).every((d) => d.low >= recent[i].low);
    if (isResistance) resistance.push(recent[i].high);
    if (isSupport) support.push(recent[i].low);
  }

  // Deduplicate close levels (within 2%)
  const dedup = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const result: number[] = [];
    for (const v of sorted) {
      if (result.length === 0 || Math.abs(v - result[result.length - 1]) / result[result.length - 1] > 0.02) {
        result.push(v);
      }
    }
    return result.slice(-5);
  };

  return { support: dedup(support), resistance: dedup(resistance) };
}

// Run all analyses
export function analyzeData(data: StockDataPoint[]): AnalysisResult {
  const closes = data.map((d) => d.close);
  const macdResult = macd(closes);
  const bbResult = bollingerBands(closes);
  const stochResult = stochastic(data);
  const sr = supportResistance(data);

  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
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
    vwap: vwap(data),
    adx: adx(data),
    williamsR: williamsR(data),
    fibLevels: fibonacci(data),
    supportLevels: sr.support,
    resistanceLevels: sr.resistance,
  };
}