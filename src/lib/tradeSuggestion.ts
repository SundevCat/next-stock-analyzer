import type { PredictionResult, TradeSuggestion } from "@/types/stock";

export function tradeSuggestionFromPrediction(
  summary: PredictionResult["summary"]
): TradeSuggestion {
  if (summary === "bullish") return "buy";
  if (summary === "bearish") return "sell";
  return "neutral";
}
