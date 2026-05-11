import { NextRequest, NextResponse } from "next/server";
import { getAllSecSymbols } from "@/services/secSymbolsService";
import { enrichStockListRows } from "@/services/stockListEnrichmentService";
import { yahooSearchSymbols } from "@/services/yahooFinanceService";
import { toTradingSymbol } from "@/lib/symbolCodec";
import type { StockSymbol } from "@/types/stock";

const SEARCH_ENRICH_CAP = 80;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    200,
    Math.max(10, parseInt(searchParams.get("limit") ?? "60", 10) || 60)
  );

  const all = await getAllSecSymbols();

  if (q.length) {
    const ql = q.toLowerCase();
    const fromSec = all.filter(
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
      map.set(t, { symbol: t, name: s.name });
    }
    for (const s of fromSec) {
      const t = toTradingSymbol(s.symbol);
      map.set(t, { symbol: t, name: s.name });
    }

    const stocks = [...map.values()].sort((a, b) =>
      a.symbol.localeCompare(b.symbol)
    );
    const totalMatched = stocks.length;
    const toEnrich = stocks.slice(0, SEARCH_ENRICH_CAP);
    const enriched = await enrichStockListRows(toEnrich);
    return NextResponse.json({
      page: 1,
      limit: enriched.length,
      totalMatched,
      totalUniverse: all.length,
      stocks: enriched,
      enrichCapped: totalMatched > enriched.length,
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
