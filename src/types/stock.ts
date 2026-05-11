export type TimeframeId =
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "4h"
  | "1d"
  | "1wk"
  | "1mo"
  | "3mo";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type StockSymbol = {
  symbol: string;
  name: string;
};

export type TradeSuggestion = "buy" | "sell" | "neutral";

/** Markets list API row — `symbol` is display form; use `tradingSymbol` for chart URLs / Yahoo. */
export type StockListItem = {
  symbol: string;
  name: string;
  tradingSymbol: string;
  price: number | null;
  suggestion: TradeSuggestion;
};

export type PredictionHorizon = {
  step: number;
  direction: "up" | "down" | "neutral";
  confidence: number;
};

export type PredictionResult = {
  summary: "bullish" | "bearish" | "neutral";
  confidence: number;
  rationale: string[];
  horizon1to10: PredictionHorizon[];
  metrics: {
    rsi14: number | null;
    ema12: number | null;
    ema26: number | null;
    lastClose: number | null;
  };
};
