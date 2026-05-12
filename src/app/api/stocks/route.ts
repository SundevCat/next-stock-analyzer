import { NextRequest, NextResponse } from "next/server";
import type { MarketId } from "@/lib/marketKind";
import { marketOfSymbol } from "@/lib/marketKind";
import { getAllMarketSymbols } from "@/services/marketUniverseService";
import { enrichStockListRows } from "@/services/stockListEnrichmentService";
import { yahooSearchSymbols } from "@/services/yahooFinanceService";
import { toTradingSymbol } from "@/lib/symbolCodec";
import type { StockSymbol } from "@/types/stock";

/** Max merged matches (Yahoo + universe) before paging (safety valve). */
const SEARCH_MERGE_CAP = 2000;

/** Max rows per page when searching (client may use lower; API caps here). */
const SEARCH_PAGE_LIMIT_MAX = 60;

function filterByMarket(rows: StockSymbol[], market: MarketId): StockSymbol[] {
  return rows.filter((r) => marketOfSymbol(r.symbol) === market);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    200,
    Math.max(10, parseInt(searchParams.get("limit") ?? "60", 10) || 60)
  );

  const mp = searchParams.get("market");
  const market: MarketId | undefined =
    mp === "us" || mp === "th" ? mp : undefined;

  const full = await getAllMarketSymbols();
  const all = market ? filterByMarket(full, market) : full;

  if (q.length) {
    const ql = q.toLowerCase();
    const fromUniverse = all.filter(
      (s) =>
        s.symbol.toLowerCase().includes(ql) ||
        s.name.toLowerCase().includes(ql)
    ).slice(0, 800);

    let fromYahoo: { symbol: string; name: string }[] = [];
    try {
      fromYahoo = await yahooSearchSymbols(q);
    } catch {
      fromYahoo = [];
    }

    const map = new Map<string, StockSymbol>();
    for (const s of fromYahoo) {
      const t = toTradingSymbol(s.symbol);
      if (market && marketOfSymbol(t) !== market) continue;
      map.set(t, { symbol: t, name: s.name });
    }
    for (const s of fromUniverse) {
      const t = toTradingSymbol(s.symbol);
      map.set(t, { symbol: t, name: s.name });
    }

    let stocks: StockSymbol[] = [...map.values()].sort((a, b) =>
      a.symbol.localeCompare(b.symbol)
    );
    if (market) stocks = filterByMarket(stocks, market);

    const fullMatchCount = stocks.length;
    stocks = stocks.slice(0, SEARCH_MERGE_CAP);
    const totalMatched = stocks.length;

    const searchLimit = Math.min(SEARCH_PAGE_LIMIT_MAX, limit);
    const start = (page - 1) * searchLimit;
    const pageSlice = stocks.slice(start, start + searchLimit);
    const enriched = await enrichStockListRows(pageSlice);

    return NextResponse.json({
      page,
      limit: searchLimit,
      totalMatched,
      totalUniverse: all.length,
      stocks: enriched,
      enrichCapped: fullMatchCount > SEARCH_MERGE_CAP,
    });
  }

  const start = (page - 1) * limit;
  const slice = all
    .map((s) => ({
      symbol: toTradingSymbol(s.symbol),
      name: s.name,
    }))
    .slice(start, start + limit);
  const enriched = await enrichStockListRows(slice);
  return NextResponse.json({
    page,
    limit,
    totalUniverse: all.length,
    stocks: enriched,
  });
}
