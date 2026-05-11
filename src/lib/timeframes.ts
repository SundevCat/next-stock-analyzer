import type { TimeframeId } from "@/types/stock";

export const TIMEFRAMES: { id: TimeframeId; label: string }[] = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1h", label: "1h" },
  { id: "4h", label: "4h" },
  { id: "1d", label: "1d" },
  { id: "1wk", label: "1W" },
  { id: "1mo", label: "1M" },
  { id: "3mo", label: "3M" },
];

/** Fallback step between candles when only one bar (seconds). */
export function timeframeBarSeconds(timeframe: TimeframeId): number {
  switch (timeframe) {
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    case "1h":
      return 3600;
    case "4h":
      return 4 * 3600;
    case "1d":
      return 86400;
    case "1wk":
      return 7 * 86400;
    case "1mo":
      return 30 * 86400;
    case "3mo":
      return 91 * 86400;
    default:
      return 86400;
  }
}

export function yahooChartParams(
  timeframe: TimeframeId
): { interval: string; range: string } {
  switch (timeframe) {
    case "1m":
      return { interval: "1m", range: "1d" };
    case "5m":
      return { interval: "5m", range: "5d" };
    case "15m":
      return { interval: "15m", range: "1mo" };
    case "1h":
      return { interval: "1h", range: "3mo" };
    case "4h":
      return { interval: "1h", range: "1y" };
    case "1d":
      return { interval: "1d", range: "5y" };
    case "1wk":
      return { interval: "1wk", range: "max" };
    case "1mo":
      return { interval: "1mo", range: "max" };
    case "3mo":
      return { interval: "3mo", range: "max" };
    default:
      return { interval: "1d", range: "5y" };
  }
}
