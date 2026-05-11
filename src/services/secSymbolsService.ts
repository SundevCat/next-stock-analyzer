import { unstable_cache } from "next/cache";
import { toTradingSymbol } from "@/lib/symbolCodec";
import type { StockSymbol } from "@/types/stock";

type SecTickerRow = { cik_str: number; ticker: string; title: string };

async function fetchSecSymbolsRaw(): Promise<StockSymbol[]> {
  const res = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers: {
      "User-Agent": "StockAnalyzer research/1.0 (educational)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`SEC symbols HTTP ${res.status}`);
  }
  const data = (await res.json()) as Record<string, SecTickerRow>;
  const list: StockSymbol[] = [];
  for (const key of Object.keys(data)) {
    const row = data[key];
    if (!row?.ticker || !row?.title) continue;
    list.push({
      symbol: toTradingSymbol(row.ticker.replace(/\./g, "-")),
      name: row.title,
    });
  }
  list.sort((a, b) => a.symbol.localeCompare(b.symbol));
  return list;
}

export const getCachedSecSymbols = unstable_cache(
  fetchSecSymbolsRaw,
  ["sec-company-tickers"],
  { revalidate: 86400 }
);

export async function getAllSecSymbols(): Promise<StockSymbol[]> {
  try {
    return await getCachedSecSymbols();
  } catch {
    return FALLBACK_SYMBOLS;
  }
}

const FALLBACK_SYMBOLS: StockSymbol[] = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "META", name: "Meta Platforms Inc." },
  { symbol: "NVDA", name: "NVIDIA Corporation" },
  { symbol: "TSLA", name: "Tesla Inc." },
  { symbol: "JPM", name: "JPMorgan Chase & Co." },
  { symbol: "V", name: "Visa Inc." },
  { symbol: "JNJ", name: "Johnson & Johnson" },
];
