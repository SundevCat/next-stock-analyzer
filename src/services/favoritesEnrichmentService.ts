import { toDisplaySymbol, toTradingSymbol } from "@/lib/symbolCodec";
import type { MarketId } from "@/lib/marketKind";
import { marketOfSymbol } from "@/lib/marketKind";
import { listFavorites } from "@/repositories/favoritesRepository";
import { enrichStockListRows } from "@/services/stockListEnrichmentService";
import { getAllMarketSymbols } from "@/services/marketUniverseService";
import type { StockListItem, StockSymbol } from "@/types/stock";

/** Daily-candle suggestions for the current session’s favourites (same logic as Markets list). */
export async function getEnrichedFavoriteStocks(
  sessionId: string,
  market?: MarketId
): Promise<StockListItem[]> {
  let symbols = await listFavorites(sessionId);
  if (market) {
    symbols = symbols.filter((s) => marketOfSymbol(s) === market);
  }
  if (symbols.length === 0) return [];

  const universe = await getAllMarketSymbols();
  const nameByTrading = new Map(
    universe.map((s) => [toTradingSymbol(s.symbol), s.name])
  );
  const stockRows: StockSymbol[] = symbols.map((sym) => ({
    symbol: sym,
    name: nameByTrading.get(sym) ?? toDisplaySymbol(sym),
  }));
  return enrichStockListRows(stockRows);
}
