import { toTradingSymbol } from "@/lib/symbolCodec";
import type { StockSymbol } from "@/types/stock";
import { getThailandSymbolUniverse } from "@/services/thSetSymbolsService";
import { getAllSecSymbols } from "@/services/secSymbolsService";

/** US SEC master list + Thailand (SET+mai from SET XLS → Yahoo .BK). US rows win on key collision. */
export async function getAllMarketSymbols(): Promise<StockSymbol[]> {
  const [us, th] = await Promise.all([
    getAllSecSymbols(),
    getThailandSymbolUniverse(),
  ]);
  const map = new Map<string, StockSymbol>();

  for (const s of us) {
    const k = toTradingSymbol(s.symbol);
    map.set(k, { symbol: k, name: s.name });
  }
  for (const s of th) {
    const k = toTradingSymbol(s.symbol);
    if (!map.has(k)) {
      map.set(k, { symbol: k, name: s.name });
    }
  }

  return [...map.values()].sort((a, b) =>
    a.symbol.localeCompare(b.symbol, undefined, { sensitivity: "base" })
  );
}