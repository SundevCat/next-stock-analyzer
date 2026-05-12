import { toDisplaySymbol, toTradingSymbol } from "@/lib/symbolCodec";
import { listFavorites } from "@/repositories/favoritesRepository";
import { enrichStockListRows } from "@/services/stockListEnrichmentService";
import { getAllSecSymbols } from "@/services/secSymbolsService";
import type { StockListItem, StockSymbol } from "@/types/stock";

/** Daily-candle suggestions for the current session’s favourites (same logic as Markets list). */
export async function getEnrichedFavoriteStocks(
  sessionId: string
): Promise<StockListItem[]> {
  const symbols = await listFavorites(sessionId);
  if (symbols.length === 0) return [];

  const allSec = await getAllSecSymbols();
  const nameByTrading = new Map(
    allSec.map((s) => [toTradingSymbol(s.symbol), s.name])
  );
  const stockRows: StockSymbol[] = symbols.map((sym) => ({
    symbol: sym,
    name: nameByTrading.get(sym) ?? toDisplaySymbol(sym),
  }));
  return enrichStockListRows(stockRows);
}
