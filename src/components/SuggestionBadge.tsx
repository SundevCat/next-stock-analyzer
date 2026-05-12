import type { TradeSuggestion } from "@/types/stock";

function suggestionLabel(s: TradeSuggestion) {
  if (s === "buy") return "Buy";
  if (s === "sell") return "Sell";
  return "Neutral";
}

function suggestionClass(s: TradeSuggestion) {
  if (s === "buy") return "text-emerald-300 bg-emerald-500/15";
  if (s === "sell") return "text-red-300 bg-red-500/15";
  return "text-slate-400 bg-slate-700/40";
}

export function SuggestionBadge({ suggestion }: { suggestion: TradeSuggestion }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${suggestionClass(suggestion)}`}
    >
      {suggestionLabel(suggestion)}
    </span>
  );
}
