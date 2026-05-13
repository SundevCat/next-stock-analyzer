import type { Candle } from "@/types/stock";

/** Last closed bars window: ~30–35% of history, capped for stability. */
const MIN_RANGE_BARS = 14;
const MAX_RANGE_BARS = 120;

export type TradingRangeLevels = {
  support: number;
  resistance: number;
  barsUsed: number;
  midpoint: number;
};

/** Closed-bar count used for trailing support/resistance window (and trend regression). */
export function trailingObservationBarCount(seriesLength: number): number | null {
  if (seriesLength < MIN_RANGE_BARS) return null;
  const pct = Math.max(
    MIN_RANGE_BARS,
    Math.min(MAX_RANGE_BARS, Math.floor(seriesLength * 0.34))
  );
  return Math.min(pct, seriesLength);
}

/** One straight segment from first to last bar time (bar index = OLS x). */
export type TrendLineSegment = {
  timeStart: number;
  priceStart: number;
  timeEnd: number;
  priceEnd: number;
};

/**
 * Parallel channel in the trailing window:
 * - Prefer **pivot + parallel** (classic TA): connect last 2 swing lows (up) or highs (down), then offset a parallel to hug the opposite side.
 * - Fallback **OLS**: separate regression on lows vs highs (lines need not be parallel).
 */
export type TrendChannel = {
  barsUsed: number;
  upper: TrendLineSegment;
  lower: TrendLineSegment;
  method: "pivot_parallel" | "ols_envelope";
  /** Set when `method === "pivot_parallel"`. */
  trend?: "up" | "down";
};

const PIVOT_RADIUS_DEFAULT = 2; // 5-bar fractal
const PIVOT_RADIUS_FALLBACK = 1;

function collectSwingLowIndices(slice: Candle[], radius: number): number[] {
  if (slice.length < 2 * radius + 1) return [];
  const out: number[] = [];
  for (let i = radius; i < slice.length - radius; i++) {
    const v = slice[i]!.low;
    let ok = true;
    for (let j = i - radius; j <= i + radius; j++) {
      if (j === i) continue;
      if (slice[j]!.low <= v) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(i);
  }
  return out;
}

function collectSwingHighIndices(slice: Candle[], radius: number): number[] {
  if (slice.length < 2 * radius + 1) return [];
  const out: number[] = [];
  for (let i = radius; i < slice.length - radius; i++) {
    const v = slice[i]!.high;
    let ok = true;
    for (let j = i - radius; j <= i + radius; j++) {
      if (j === i) continue;
      if (slice[j]!.high >= v) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(i);
  }
  return out;
}

/** Line through (x0,y0)→(x1,y1); x is bar index inside slice (0 … n−1). */
function evalPivotLine(x0: number, y0: number, x1: number, y1: number, x: number): number {
  if (x1 === x0 || !Number.isFinite(y0) || !Number.isFinite(y1)) return y0;
  const m = (y1 - y0) / (x1 - x0);
  return y0 + m * (x - x0);
}

function buildPivotParallelChannel(slice: Candle[]): Omit<TrendChannel, "barsUsed"> | null {
  let lowIdx = collectSwingLowIndices(slice, PIVOT_RADIUS_DEFAULT);
  let highIdx = collectSwingHighIndices(slice, PIVOT_RADIUS_DEFAULT);
  if (lowIdx.length < 2) lowIdx = collectSwingLowIndices(slice, PIVOT_RADIUS_FALLBACK);
  if (highIdx.length < 2) highIdx = collectSwingHighIndices(slice, PIVOT_RADIUS_FALLBACK);

  let upOk =
    lowIdx.length >= 2 &&
    (() => {
      const b = lowIdx[lowIdx.length - 1]!;
      const a = lowIdx[lowIdx.length - 2]!;
      return a < b && slice[b]!.low > slice[a]!.low;
    })();

  let downOk =
    highIdx.length >= 2 &&
    (() => {
      const b = highIdx[highIdx.length - 1]!;
      const a = highIdx[highIdx.length - 2]!;
      return a < b && slice[b]!.high < slice[a]!.high;
    })();

  if (upOk && downOk) {
    const n = slice.length;
    const lc = slice[n - 1]!.close - slice[0]!.close;
    if (lc <= 0) upOk = false;
    else downOk = false;
  }

  const n = slice.length;
  let trend: "up" | "down";
  let upper: TrendLineSegment;
  let lower: TrendLineSegment;

  if (upOk) {
    trend = "up";
    const b = lowIdx[lowIdx.length - 1]!;
    const a = lowIdx[lowIdx.length - 2]!;
    const lx0 = slice[a]!.low;
    const lx1 = slice[b]!.low;
    let maxAbove = Number.NEGATIVE_INFINITY;
    for (let j = 0; j < n; j++) {
      const lj = evalPivotLine(a, lx0, b, lx1, j);
      maxAbove = Math.max(maxAbove, slice[j]!.high - lj);
    }
    if (!Number.isFinite(maxAbove)) return null;
    const lLeft = evalPivotLine(a, lx0, b, lx1, 0);
    const lRight = evalPivotLine(a, lx0, b, lx1, n - 1);
    const uLeft = lLeft + maxAbove;
    const uRight = lRight + maxAbove;
    upper = {
      timeStart: slice[0]!.time,
      priceStart: uLeft,
      timeEnd: slice[n - 1]!.time,
      priceEnd: uRight,
    };
    lower = {
      timeStart: slice[0]!.time,
      priceStart: lLeft,
      timeEnd: slice[n - 1]!.time,
      priceEnd: lRight,
    };
  } else if (downOk) {
    trend = "down";
    const b = highIdx[highIdx.length - 1]!;
    const a = highIdx[highIdx.length - 2]!;
    const hx0 = slice[a]!.high;
    const hx1 = slice[b]!.high;
    let minBelow = Number.POSITIVE_INFINITY;
    for (let j = 0; j < n; j++) {
      const hj = evalPivotLine(a, hx0, b, hx1, j);
      minBelow = Math.min(minBelow, slice[j]!.low - hj);
    }
    if (!Number.isFinite(minBelow)) return null;
    const uLeft = evalPivotLine(a, hx0, b, hx1, 0);
    const uRight = evalPivotLine(a, hx0, b, hx1, n - 1);
    const lLeft = uLeft + minBelow;
    const lRight = uRight + minBelow;
    upper = {
      timeStart: slice[0]!.time,
      priceStart: uLeft,
      timeEnd: slice[n - 1]!.time,
      priceEnd: uRight,
    };
    lower = {
      timeStart: slice[0]!.time,
      priceStart: lLeft,
      timeEnd: slice[n - 1]!.time,
      priceEnd: lRight,
    };
  } else {
    return null;
  }

  return { upper, lower, method: "pivot_parallel", trend };
}

function olsRegressionEndpoints(
  slice: Candle[],
  pick: (c: Candle) => number
): { p0: number; p1: number } | null {
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  const n = slice.length;
  for (let i = 0; i < n; i++) {
    const yi = pick(slice[i]!);
    if (!Number.isFinite(yi)) return null;
    sumX += i;
    sumY += yi;
    sumXX += i * i;
    sumXY += i * yi;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  const p0 = a + b * 0;
  const p1 = a + b * (n - 1);
  if (!Number.isFinite(p0) || !Number.isFinite(p1)) return null;
  return { p0, p1 };
}

export function computeTrendChannel(candles: Candle[]): TrendChannel | null {
  const w = trailingObservationBarCount(candles.length);
  if (w === null || w < 2) return null;
  const slice = candles.slice(-w);

  const pivot = buildPivotParallelChannel(slice);
  if (pivot) {
    return { barsUsed: w, ...pivot };
  }

  const hi = olsRegressionEndpoints(slice, (c) => c.high);
  const lo = olsRegressionEndpoints(slice, (c) => c.low);
  if (!hi || !lo) return null;
  const t0 = slice[0]!.time;
  const t1 = slice[slice.length - 1]!.time;
  return {
    barsUsed: w,
    method: "ols_envelope",
    upper: {
      timeStart: t0,
      priceStart: hi.p0,
      timeEnd: t1,
      priceEnd: hi.p1,
    },
    lower: {
      timeStart: t0,
      priceStart: lo.p0,
      timeEnd: t1,
      priceEnd: lo.p1,
    },
  };
}

/** Swing high/low of the trailing window approximates liquidity support / resistance zones. */
export function computeTradingRangeLevels(
  candles: Candle[]
): TradingRangeLevels | null {
  const w = trailingObservationBarCount(candles.length);
  if (w === null) return null;
  const slice = candles.slice(-w);

  let resistance = slice[0]!.high;
  let support = slice[0]!.low;
  for (const c of slice) {
    resistance = Math.max(resistance, c.high);
    support = Math.min(support, c.low);
  }
  if (
    !Number.isFinite(support) ||
    !Number.isFinite(resistance) ||
    resistance <= support
  ) {
    return null;
  }
  return {
    support,
    resistance,
    barsUsed: w,
    midpoint: support + (resistance - support) / 2,
  };
}

export function formatChartPrice(referenceClose: number, value: number): string {
  if (!Number.isFinite(referenceClose) || referenceClose <= 0) {
    return value.toFixed(value >= 1 ? 2 : 4);
  }
  if (referenceClose >= 500) return value.toFixed(2);
  if (referenceClose >= 1) return value.toFixed(4);
  return value.toFixed(6);
}
