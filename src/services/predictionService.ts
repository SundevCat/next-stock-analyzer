import type { Candle, PredictionResult, PredictionHorizon } from "@/types/stock";

function emaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev: number | undefined;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    prev = prev === undefined ? v : v * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function rsiLast(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const ch = closes[i]! - closes[i - 1]!;
    if (ch >= 0) gains += ch;
    else losses -= ch;
  }
  const avgG = gains / period;
  const avgL = losses / period;
  if (avgL === 0 && avgG === 0) return 50;
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function linearRegressionSlope(y: number[]): number {
  const n = y.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += y[i]!;
    sumXY += i * y[i]!;
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function predictFromCandles(candles: Candle[]): PredictionResult {
  const closes = candles.map((c) => c.close);
  const lastClose = closes.at(-1) ?? null;
  if (closes.length < 30 || !lastClose) {
    return {
      summary: "neutral",
      confidence: 0,
      rationale: ["Not enough history to score momentum indicators."],
      horizon1to10: [],
      metrics: { rsi14: null, ema12: null, ema26: null, lastClose },
    };
  }

  const ema12s = emaSeries(closes, 12);
  const ema26s = emaSeries(closes, 26);
  const ema12 = ema12s.at(-1) ?? null;
  const ema26 = ema26s.at(-1) ?? null;
  const rsi14 = rsiLast(closes, 14);

  const rationale: string[] = [];
  let score = 0;

  if (ema12 != null && ema26 != null) {
    if (ema12 > ema26) {
      score += 1;
      rationale.push("Short EMA is above long EMA (bullish crossover bias).");
    } else {
      score -= 1;
      rationale.push("Short EMA is below long EMA (bearish crossover bias).");
    }
  }

  if (rsi14 != null) {
    if (rsi14 > 55 && rsi14 < 70) {
      score += 0.5;
      rationale.push(`RSI near ${rsi14.toFixed(1)} suggests positive momentum without extreme overbought.`);
    } else if (rsi14 < 45 && rsi14 > 30) {
      score -= 0.5;
      rationale.push(`RSI near ${rsi14.toFixed(1)} suggests negative momentum without extreme oversold.`);
    } else if (rsi14 >= 70) {
      score -= 0.25;
      rationale.push(`RSI ${rsi14.toFixed(1)} is elevated; trend may be stretched up.`);
    } else if (rsi14 <= 30) {
      score += 0.25;
      rationale.push(`RSI ${rsi14.toFixed(1)} is depressed; bounce risk rises (contrarian).`);
    }
  }

  const window = closes.slice(-40);
  const slope = linearRegressionSlope(window);
  const relSlope = lastClose !== 0 ? slope / lastClose : 0;
  if (relSlope > 0.0005) {
    score += 0.75;
    rationale.push("Recent linear regression on closes slopes upward.");
  } else if (relSlope < -0.0005) {
    score -= 0.75;
    rationale.push("Recent linear regression on closes slopes downward.");
  }

  let summary: PredictionResult["summary"] = "neutral";
  if (score > 0.35) summary = "bullish";
  else if (score < -0.35) summary = "bearish";

  const confidence = clamp(Math.abs(score) / 2.25, 0.15, 0.92);

  const horizon1to10: PredictionHorizon[] = [];
  const recentVol =
    closes.length >= 2
      ? Math.abs(closes.at(-1)! - closes.at(-2)!) / (lastClose || 1)
      : 0.001;

  const baseSign = summary === "bullish" ? 1 : summary === "bearish" ? -1 : Math.sign(relSlope) || 0;

  for (let step = 1; step <= 10; step++) {
    const decay = 1 / (1 + step * 0.08);
    const volBoost = 1 + Math.min(recentVol * 50, 0.4);
    const rsiPhase = rsi14 != null ? (rsi14 / 55) * 0.08 : 0;
    /** Small per-step ripple so horizons are not a flat “all down” / “all up” strip on every timeframe */
    const ripple =
      Math.sin(step * 1.06 + rsiPhase * 23) *
      (0.1 + 0.13 * confidence) *
      Math.min(volBoost, 1.2);
    const impulse = baseSign * confidence * decay * volBoost + ripple;
    let direction: PredictionHorizon["direction"] = "neutral";
    if (impulse > 0.12) direction = "up";
    else if (impulse < -0.12) direction = "down";
    horizon1to10.push({
      step,
      direction,
      confidence: clamp(Math.abs(impulse), 0.05, 0.95),
    });
  }

  return {
    summary,
    confidence,
    rationale,
    horizon1to10,
    metrics: {
      rsi14,
      ema12,
      ema26,
      lastClose,
    },
  };
}
