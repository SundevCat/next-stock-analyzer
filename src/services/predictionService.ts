import type { Candle, PredictionResult, PredictionHorizon } from "@/types/stock";
import { detectCandlePatterns } from "@/lib/chartPatterns";

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

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = closes[i]! - closes[i - 1]!;
    if (ch >= 0) avgGain += ch;
    else avgLoss -= ch;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const ch = closes[i]! - closes[i - 1]!;
    const gain = ch > 0 ? ch : 0;
    const loss = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0 && avgGain === 0) return 50;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
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
      patterns: [],
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

  const patterns = detectCandlePatterns(candles, 30);
  const lastBarTime = candles.at(-1)?.time;
  const penultTime = candles.at(-2)?.time;
  const latest = patterns.length > 0 ? patterns[patterns.length - 1]! : null;
  /**
   * Freshness gate: only score a pattern that completed on the last or penultimate bar.
   * Engulfing technically completes on bar n but represents a 2-bar event starting at n-1,
   * so either timestamp counts. Older patterns stay in the returned list for chart markers
   * but do not bias the current bullish/bearish summary.
   */
  const isFresh =
    latest != null &&
    (latest.time === lastBarTime || latest.time === penultTime);

  let confidenceMultiplier = 1;
  if (isFresh && latest) {
    switch (latest.kind) {
      case "bullish_engulfing":
        score += 0.6;
        rationale.push("Bullish engulfing on the latest bars.");
        break;
      case "bearish_engulfing":
        score -= 0.6;
        rationale.push("Bearish engulfing on the latest bars.");
        break;
      case "hammer":
        score += 0.4;
        rationale.push("Hammer after a down move (bullish reversal hint).");
        break;
      case "shooting_star":
        score -= 0.4;
        rationale.push("Shooting star after an up move (bearish reversal hint).");
        break;
      case "doji":
        confidenceMultiplier = 0.75;
        rationale.push("Doji on the latest bar — indecision; confidence trimmed.");
        break;
    }
  }

  let summary: PredictionResult["summary"] = "neutral";
  if (score > 0.35) summary = "bullish";
  else if (score < -0.35) summary = "bearish";

  const confidence = clamp(
    (Math.abs(score) / 3.0) * confidenceMultiplier,
    0.15,
    0.92
  );

  const horizon1to10: PredictionHorizon[] = [];
  const recentVol =
    closes.length >= 2
      ? Math.abs(closes.at(-1)! - closes.at(-2)!) / (lastClose || 1)
      : 0.001;

  const baseSign = summary === "bullish" ? 1 : summary === "bearish" ? -1 : Math.sign(relSlope) || 0;

  for (let step = 1; step <= 10; step++) {
    const decay = 1 / (1 + step * 0.08);
    const volBoost = 1 + Math.min(recentVol * 50, 0.4);
    const impulse = baseSign * confidence * decay * volBoost;
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
    patterns,
  };
}
