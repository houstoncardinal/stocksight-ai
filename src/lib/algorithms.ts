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
  // Moving Averages
  sma20: number[];
  sma50: number[];
  sma200: number[];
  ema9: number[];
  ema12: number[];
  ema21: number[];
  ema26: number[];
  // Momentum
  rsi: number[];
  macd: number[];
  macdSignal: number[];
  macdHistogram: number[];
  stochK: number[];
  stochD: number[];
  cci: number[];
  mfi: number[];
  roc: number[];
  williamsR: number[];
  // Volatility
  bollingerUpper: number[];
  bollingerMiddle: number[];
  bollingerLower: number[];
  atr: number[];
  // Volume
  obv: number[];
  vwap: number[];
  // Trend
  adx: number[];
  aroonUp: number[];
  aroonDown: number[];
  // Ichimoku
  tenkan: number[];
  kijun: number[];
  senkouA: number[];
  senkouB: number[];
  // Levels
  fibLevels: FibonacciLevels;
  supportLevels: number[];
  resistanceLevels: number[];
  // Pivot Points (based on last completed day)
  pivotPoint: number;
  pivotR1: number;
  pivotR2: number;
  pivotR3: number;
  pivotS1: number;
  pivotS2: number;
  pivotS3: number;
}

export interface FibonacciLevels {
  high: number;
  low: number;
  levels: { ratio: number; label: string; price: number }[];
}

// ── Core Calculations ──────────────────────────────────────────────────────────

export function sma(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += data[j];
    result[i] = sum / period;
  }
  return result;
}

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
    if (!isNaN(macdLine[i])) { signal[i] = signalEma[idx] ?? NaN; idx++; }
  }
  const histogram = data.map((_, i) =>
    isNaN(macdLine[i]) || isNaN(signal[i]) ? NaN : macdLine[i] - signal[i]
  );
  return { macd: macdLine, signal, histogram };
}

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

export function atr(data: StockDataPoint[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  const tr: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const h = data[i].high, l = data[i].low, pc = data[i - 1].close;
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

export function stochastic(data: StockDataPoint[], kPeriod = 14, dPeriod = 3) {
  const kValues: number[] = new Array(data.length).fill(NaN);
  for (let i = kPeriod - 1; i < data.length; i++) {
    const slice = data.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...slice.map((d) => d.high));
    const lowest = Math.min(...slice.map((d) => d.low));
    kValues[i] = highest === lowest ? 50 : ((data[i].close - lowest) / (highest - lowest)) * 100;
  }
  const dValues = sma(kValues.map((v) => (isNaN(v) ? 0 : v)), dPeriod);
  return { k: kValues, d: dValues };
}

export function obv(data: StockDataPoint[]): number[] {
  const result: number[] = [0];
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) result.push(result[i - 1] + data[i].volume);
    else if (data[i].close < data[i - 1].close) result.push(result[i - 1] - data[i].volume);
    else result.push(result[i - 1]);
  }
  return result;
}

export function vwap(data: StockDataPoint[]): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  let cumTPV = 0, cumVol = 0;
  for (let i = 0; i < data.length; i++) {
    const tp = (data[i].high + data[i].low + data[i].close) / 3;
    cumTPV += tp * data[i].volume;
    cumVol += data[i].volume;
    result[i] = cumVol === 0 ? NaN : cumTPV / cumVol;
  }
  return result;
}

export function adx(data: StockDataPoint[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period + 1) return result;
  const plusDM: number[] = [], minusDM: number[] = [], trArr: number[] = [];
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
    dxArr.push(diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100);
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

// ── New Algorithms ─────────────────────────────────────────────────────────────

/** Commodity Channel Index — measures price deviation from statistical average.
 *  >100 = overbought, <-100 = oversold */
export function cci(data: StockDataPoint[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  const tp = data.map((d) => (d.high + d.low + d.close) / 3);
  for (let i = period - 1; i < data.length; i++) {
    const slice = tp.slice(i - period + 1, i + 1);
    const meanTP = slice.reduce((a, b) => a + b, 0) / period;
    const meanDev = slice.reduce((a, b) => a + Math.abs(b - meanTP), 0) / period;
    result[i] = meanDev === 0 ? 0 : (tp[i] - meanTP) / (0.015 * meanDev);
  }
  return result;
}

/** Money Flow Index — volume-weighted RSI.
 *  >80 = overbought, <20 = oversold */
export function mfi(data: StockDataPoint[], period = 14): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  const tp = data.map((d) => (d.high + d.low + d.close) / 3);
  const rmf = tp.map((t, i) => t * data[i].volume);

  for (let i = period; i < data.length; i++) {
    let posFlow = 0, negFlow = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) posFlow += rmf[j];
      else negFlow += rmf[j];
    }
    const ratio = negFlow === 0 ? 100 : posFlow / negFlow;
    result[i] = 100 - 100 / (1 + ratio);
  }
  return result;
}

/** Aroon Indicator (25-period) — identifies trend direction and strength.
 *  Up >70 + Down <30 = strong uptrend */
export function aroon(data: StockDataPoint[], period = 25): { up: number[]; down: number[] } {
  const upArr: number[] = new Array(data.length).fill(NaN);
  const downArr: number[] = new Array(data.length).fill(NaN);
  for (let i = period; i < data.length; i++) {
    const slice = data.slice(i - period, i + 1);
    let highIdx = 0, lowIdx = 0;
    for (let j = 1; j <= period; j++) {
      if (slice[j].high >= slice[highIdx].high) highIdx = j;
      if (slice[j].low  <= slice[lowIdx].low)   lowIdx  = j;
    }
    upArr[i]   = ((highIdx) / period) * 100;
    downArr[i] = ((lowIdx)  / period) * 100;
  }
  return { up: upArr, down: downArr };
}

/** Rate of Change — percentage change over n periods.
 *  Measures momentum velocity */
export function roc(data: number[], period = 10): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  for (let i = period; i < data.length; i++) {
    result[i] = data[i - period] !== 0
      ? ((data[i] - data[i - period]) / data[i - period]) * 100
      : NaN;
  }
  return result;
}

/** Ichimoku Cloud — comprehensive trend system.
 *  Returns arrays for each component */
export function ichimoku(data: StockDataPoint[]): {
  tenkan: number[];
  kijun: number[];
  senkouA: number[];
  senkouB: number[];
} {
  const len = data.length;
  const mid = (arr: StockDataPoint[], from: number, to: number) => {
    const slice = arr.slice(from, to);
    return (Math.max(...slice.map(d => d.high)) + Math.min(...slice.map(d => d.low))) / 2;
  };

  const tenkanArr: number[] = new Array(len).fill(NaN);
  const kijunArr:  number[] = new Array(len).fill(NaN);
  const senkouA:   number[] = new Array(len).fill(NaN);
  const senkouB:   number[] = new Array(len).fill(NaN);

  for (let i = 8; i < len; i++)  tenkanArr[i] = mid(data, i - 8,  i + 1);
  for (let i = 25; i < len; i++) kijunArr[i]  = mid(data, i - 25, i + 1);

  // Senkou A = avg(tenkan, kijun) shifted 26 forward — here we store at current position
  for (let i = 25; i < len; i++) {
    if (!isNaN(tenkanArr[i]) && !isNaN(kijunArr[i])) {
      senkouA[i] = (tenkanArr[i] + kijunArr[i]) / 2;
    }
  }
  // Senkou B = 52-period midpoint shifted 26 forward
  for (let i = 51; i < len; i++) {
    senkouB[i] = mid(data, i - 51, i + 1);
  }

  return { tenkan: tenkanArr, kijun: kijunArr, senkouA, senkouB };
}

/** Standard Pivot Points from previous trading session */
export function pivotPoints(data: StockDataPoint[]): {
  pp: number; r1: number; r2: number; r3: number;
  s1: number; s2: number; s3: number;
} {
  const prev = data[data.length - 2] ?? data[data.length - 1];
  const { high: h, low: l, close: c } = prev;
  const pp = (h + l + c) / 3;
  return {
    pp,
    r1: 2 * pp - l,
    r2: pp + (h - l),
    r3: h + 2 * (pp - l),
    s1: 2 * pp - h,
    s2: pp - (h - l),
    s3: l - 2 * (h - pp),
  };
}

// ── Fibonacci ──────────────────────────────────────────────────────────────────

export function fibonacci(data: StockDataPoint[]): FibonacciLevels {
  const recent = data.slice(-120);
  const high = Math.max(...recent.map((d) => d.high));
  const low  = Math.min(...recent.map((d) => d.low));
  const diff = high - low;
  const ratios = [
    { ratio: 0,     label: "0%"    },
    { ratio: 0.236, label: "23.6%" },
    { ratio: 0.382, label: "38.2%" },
    { ratio: 0.5,   label: "50.0%" },
    { ratio: 0.618, label: "61.8%" },
    { ratio: 0.786, label: "78.6%" },
    { ratio: 1,     label: "100%"  },
  ];
  return { high, low, levels: ratios.map((r) => ({ ...r, price: low + diff * r.ratio })) };
}

// ── Support & Resistance ──────────────────────────────────────────────────────

export function supportResistance(data: StockDataPoint[], lookback = 20): { support: number[]; resistance: number[] } {
  const support: number[] = [], resistance: number[] = [];
  const recent = data.slice(-Math.min(data.length, 252));
  for (let i = lookback; i < recent.length - lookback; i++) {
    if (recent.slice(i - lookback, i + lookback + 1).every((d) => d.high <= recent[i].high))
      resistance.push(recent[i].high);
    if (recent.slice(i - lookback, i + lookback + 1).every((d) => d.low >= recent[i].low))
      support.push(recent[i].low);
  }
  const dedup = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const result: number[] = [];
    for (const v of sorted) {
      if (result.length === 0 || Math.abs(v - result[result.length - 1]) / result[result.length - 1] > 0.02)
        result.push(v);
    }
    return result.slice(-5);
  };
  return { support: dedup(support), resistance: dedup(resistance) };
}

// ── Master Analysis Runner ────────────────────────────────────────────────────

export function analyzeData(data: StockDataPoint[]): AnalysisResult {
  const closes = data.map((d) => d.close);
  const macdResult  = macd(closes);
  const bbResult    = bollingerBands(closes);
  const stochResult = stochastic(data);
  const aroonResult = aroon(data);
  const ichimokuResult = ichimoku(data);
  const pivots      = pivotPoints(data);
  const sr          = supportResistance(data);

  return {
    sma20:  sma(closes, 20),
    sma50:  sma(closes, 50),
    sma200: sma(closes, 200),
    ema9:   ema(closes, 9),
    ema12:  ema(closes, 12),
    ema21:  ema(closes, 21),
    ema26:  ema(closes, 26),
    rsi:    rsi(closes),
    macd:           macdResult.macd,
    macdSignal:     macdResult.signal,
    macdHistogram:  macdResult.histogram,
    stochK: stochResult.k,
    stochD: stochResult.d,
    cci:    cci(data),
    mfi:    mfi(data),
    roc:    roc(closes),
    williamsR: williamsR(data),
    bollingerUpper:  bbResult.upper,
    bollingerMiddle: bbResult.middle,
    bollingerLower:  bbResult.lower,
    atr:  atr(data),
    obv:  obv(data),
    vwap: vwap(data),
    adx:  adx(data),
    aroonUp:   aroonResult.up,
    aroonDown: aroonResult.down,
    tenkan:  ichimokuResult.tenkan,
    kijun:   ichimokuResult.kijun,
    senkouA: ichimokuResult.senkouA,
    senkouB: ichimokuResult.senkouB,
    fibLevels:        fibonacci(data),
    supportLevels:    sr.support,
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
