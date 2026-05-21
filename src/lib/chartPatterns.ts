import type { Candle, DetectedPattern } from "@/types/stock";

const DEFAULT_LOOKBACK = 30;
const DOJI_BODY_RATIO = 0.03;
const WICK_BODY_RATIO = 2.0;
const OPPOSITE_WICK_RATIO = 0.4;
const TREND_LOOKBACK = 10;
const TREND_PCT_THRESHOLD = 0.01;
/** Engulfing requires the previous bar to have a meaningful body (≥ 10 % of its range) — avoids "engulfing" a near-doji. */
const ENGULFING_MIN_PREV_BODY_RATIO = 0.1;

function hasMeaningfulBody(c: Candle): boolean {
  const range = c.high - c.low;
  if (range <= 0) return false;
  const body = Math.abs(c.close - c.open);
  return body / range >= ENGULFING_MIN_PREV_BODY_RATIO;
}

function isBullishEngulfing(prev: Candle, cur: Candle): boolean {
  const prevBear = prev.close < prev.open;
  const curBull = cur.close > cur.open;
  return (
    prevBear &&
    curBull &&
    hasMeaningfulBody(prev) &&
    cur.open <= prev.close &&
    cur.close >= prev.open
  );
}

function isBearishEngulfing(prev: Candle, cur: Candle): boolean {
  const prevBull = prev.close > prev.open;
  const curBear = cur.close < cur.open;
  return (
    prevBull &&
    curBear &&
    hasMeaningfulBody(prev) &&
    cur.open >= prev.close &&
    cur.close <= prev.open
  );
}

function isDoji(c: Candle): boolean {
  const range = c.high - c.low;
  if (range <= 0) return false;
  return Math.abs(c.close - c.open) / range <= DOJI_BODY_RATIO;
}

function isHammer(c: Candle): boolean {
  const body = Math.abs(c.close - c.open);
  if (body <= 0) return false;
  const lowerWick = Math.min(c.open, c.close) - c.low;
  const upperWick = c.high - Math.max(c.open, c.close);
  return (
    lowerWick >= WICK_BODY_RATIO * body &&
    upperWick <= OPPOSITE_WICK_RATIO * body
  );
}

function isShootingStar(c: Candle): boolean {
  const body = Math.abs(c.close - c.open);
  if (body <= 0) return false;
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  return (
    upperWick >= WICK_BODY_RATIO * body &&
    lowerWick <= OPPOSITE_WICK_RATIO * body
  );
}

/** Net close-to-close trend across `lookback` bars ending just before `endIdxExclusive`. */
function trendBefore(
  candles: Candle[],
  endIdxExclusive: number,
  lookback = TREND_LOOKBACK
): "up" | "down" | "flat" {
  const start = Math.max(0, endIdxExclusive - lookback);
  if (endIdxExclusive - start < 3) return "flat";
  const a = candles[start]!.close;
  const b = candles[endIdxExclusive - 1]!.close;
  if (a <= 0) return "flat";
  const pct = (b - a) / a;
  if (pct > TREND_PCT_THRESHOLD) return "up";
  if (pct < -TREND_PCT_THRESHOLD) return "down";
  return "flat";
}

/**
 * Scan the trailing `lookbackBars` candles and return Tier-A candle patterns in chronological order.
 * Priority on each bar: engulfing → hammer/shooting-star (trend-context required) → doji.
 *
 * Note: a small-bodied hammer that fails the trend gate can still match `isDoji` and be emitted
 * as a doji on that bar — that is the conservative, lower-confidence reading and is intentional.
 */
export function detectCandlePatterns(
  candles: Candle[],
  lookbackBars: number = DEFAULT_LOOKBACK
): DetectedPattern[] {
  if (candles.length < 2) return [];
  const span = Math.max(1, Math.min(lookbackBars, candles.length));
  const start = Math.max(1, candles.length - span);
  const out: DetectedPattern[] = [];

  for (let i = start; i < candles.length; i++) {
    const cur = candles[i]!;
    const prev = candles[i - 1]!;

    if (isBullishEngulfing(prev, cur)) {
      out.push({ kind: "bullish_engulfing", time: cur.time, bias: "bullish" });
      continue;
    }
    if (isBearishEngulfing(prev, cur)) {
      out.push({ kind: "bearish_engulfing", time: cur.time, bias: "bearish" });
      continue;
    }
    if (isHammer(cur) && trendBefore(candles, i) === "down") {
      out.push({ kind: "hammer", time: cur.time, bias: "bullish" });
      continue;
    }
    if (isShootingStar(cur) && trendBefore(candles, i) === "up") {
      out.push({ kind: "shooting_star", time: cur.time, bias: "bearish" });
      continue;
    }
    if (isDoji(cur)) {
      out.push({ kind: "doji", time: cur.time, bias: "neutral" });
    }
  }
  return out;
}
