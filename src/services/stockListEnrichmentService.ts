import { tradeSuggestionFromPrediction } from "@/lib/tradeSuggestion";
import { toDisplaySymbol, toTradingSymbol } from "@/lib/symbolCodec";
import type { StockListItem, StockSymbol } from "@/types/stock";
import { predictFromCandles } from "@/services/predictionService";
import { fetchYahooCandles } from "@/services/yahooFinanceService";

const CHUNK = 10;

type NormalizedListRow = {
  symbol: string;
  name: string;
  tradingSymbol: string;
};

async function enrichOne(row: NormalizedListRow): Promise<StockListItem> {
  try {
    const candles = await fetchYahooCandles(row.tradingSymbol, "1d");
    const prediction = predictFromCandles(candles);
    return {
      symbol: row.symbol,
      name: row.name,
      tradingSymbol: row.tradingSymbol,
      price: prediction.metrics.lastClose,
      suggestion: tradeSuggestionFromPrediction(prediction.summary),
    };
  } catch {
    return {
      symbol: row.symbol,
      name: row.name,
      tradingSymbol: row.tradingSymbol,
      price: null,
      suggestion: "neutral",
    };
  }
}

/**
 * Enriches list rows using **daily (1d)** candles only: last close + Buy/Sell/Neutral.
 * The stock detail page uses whatever timeframe the user selects for chart + prediction.
 */
export async function enrichStockListRows(rows: StockSymbol[]): Promise<StockListItem[]> {
  const normalized = rows.map((r) => {
    const tradingSymbol = toTradingSymbol(r.symbol);
    return {
      symbol: toDisplaySymbol(r.symbol),
      name: r.name,
      tradingSymbol,
    };
  });

  const out: StockListItem[] = [];
  for (let i = 0; i < normalized.length; i += CHUNK) {
    const slice = normalized.slice(i, i + CHUNK);
    const part = await Promise.all(slice.map((row) => enrichOne(row)));
    out.push(...part);
  }
  return out;
}
