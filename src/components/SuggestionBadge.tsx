import { Minus, TrendingDown, TrendingUp } from "lucide-react";
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

type Props = {
  suggestion: TradeSuggestion;
  /** Compact icon for dense tables (e.g. mobile); pair with full label in larger viewports. */
  variant?: "default" | "icon";
};

export function SuggestionBadge({ suggestion, variant = "default" }: Props) {
  const label = suggestionLabel(suggestion);

  if (variant === "icon") {
    const Icon =
      suggestion === "buy"
        ? TrendingUp
        : suggestion === "sell"
          ? TrendingDown
          : Minus;
    return (
      <span
        className={`inline-flex size-8 items-center justify-center rounded-full ${suggestionClass(suggestion)}`}
        title={label}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
        <span className="sr-only">{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${suggestionClass(suggestion)}`}
    >
      {label}
    </span>
  );
}