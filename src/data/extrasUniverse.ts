import { toTradingSymbol } from "@/lib/symbolCodec";
import type { StockSymbol } from "@/types/stock";

/**
 * Indices, forex / spot metals (=X), gold proxies, ETFs, and Thailand-listed funds.
 * Note: Yahoo does not use “INDEXSP:.INX”; US S&P 500 is ^GSPC (SPX /.INX equivalents).
 */
export const EXTRAS_UNIVERSE: StockSymbol[] = [
  /* US equity indices (^… on Yahoo — same lane as SPX /.INX benchmarks) */
  { symbol: "^GSPC", name: "Index · S&P 500 (Yahoo ^GSPC; เทียบ INX / INDEXSP:.INX)" },
  { symbol: "^DJI", name: "Index · Dow Jones Industrial Average" },
  { symbol: "^IXIC", name: "Index · Nasdaq Composite" },
  { symbol: "^NDX", name: "Index · Nasdaq-100" },
  { symbol: "^RUT", name: "Index · Russell 2000" },
  { symbol: "^VIX", name: "Index · CBOE Volatility (VIX)" },
  { symbol: "^NYA", name: "Index · NYSE Composite" },
  { symbol: "^W5000", name: "Index · Wilshire 5000 Total Market" },

  /* Global indices (liquid Yahoo symbols) */
  { symbol: "^FTSE", name: "Index · FTSE 100" },
  { symbol: "^GDAXI", name: "Index · DAX 40 (Germany)" },
  { symbol: "^FCHI", name: "Index · CAC 40 (France)" },
  { symbol: "^N225", name: "Index · Nikkei 225" },
  { symbol: "^HSI", name: "Index · Hang Seng" },
  { symbol: "^STOXX50E", name: "Index · EURO STOXX 50" },
  { symbol: "^SET.BK", name: "Index · SET (Thailand broad)" },

  /* Spot FX / precious metals (pair format X…=X — XAUUSD is gold vs USD spot) */
  { symbol: "XAUUSD=X", name: "FX · Gold/USD spot label (OHLC via COMEX GC=F — Yahoo)" },
  { symbol: "XAGUSD=X", name: "FX · Silver/USD spot label (OHLC via COMEX SI=F — Yahoo)" },
  { symbol: "EURUSD=X", name: "FX · EUR / USD" },
  { symbol: "GBPUSD=X", name: "FX · GBP / USD" },
  { symbol: "USDJPY=X", name: "FX · USD / JPY" },
  { symbol: "USDCHF=X", name: "FX · USD / CHF" },
  { symbol: "AUDUSD=X", name: "FX · AUD / USD" },
  { symbol: "USDCAD=X", name: "FX · USD / CAD" },
  { symbol: "NZDUSD=X", name: "FX · NZD / USD" },
  { symbol: "USDTHB=X", name: "FX · USD / THB" },

  /* Gold · USD benchmarks (futures / ETF) */
  { symbol: "GC=F", name: "Gold · COMEX futures (USD)" },
  { symbol: "GLD", name: "Gold · SPDR Gold Trust (USD ETF)" },
  { symbol: "IAU", name: "Gold · iShares Gold Trust (USD ETF)" },

  /* Gold · Thailand — baht-listed gold ETF tracking physical gold via master fund */
  { symbol: "GLD.BK", name: "Gold · KTAM Gold ETF Tracker (THB)" },

  /* US funds / ETFs (sampled) */
  { symbol: "VTI", name: "Fund · Vanguard Total Stock Market ETF" },
  { symbol: "VOO", name: "Fund · Vanguard S&P 500 ETF" },
  { symbol: "BND", name: "Fund · Vanguard Total Bond Market ETF" },
  { symbol: "QQQ", name: "Fund · Invesco QQQ Trust" },
  { symbol: "SPY", name: "Fund · SPDR S&P 500 ETF" },
  { symbol: "AGG", name: "Fund · iShares Core US Aggregate Bond ETF" },
  { symbol: "VXUS", name: "Fund · Vanguard Total International Stock ETF" },
  {
    symbol: "VGT",
    name: "Fund · Vanguard Information Technology ETF",
  },

  /* Thailand ETFs / diversified funds — Yahoo .BK */
  { symbol: "TDEX.BK", name: "Fund · ThaiDEX SET50 ETF" },
  {
    symbol: "THD",
    name: "Fund · iShares MSCI Thailand ETF (US-listed Thai basket)",
  },
];

const keys = new Set(
  EXTRAS_UNIVERSE.map((row) => toTradingSymbol(row.symbol))
);

/** Display name used when enriching favourites missing from SEC/SET universe */
const nameMap = new Map(
  EXTRAS_UNIVERSE.map((row) => [toTradingSymbol(row.symbol), row.name])
);

export function isExtrasSymbol(raw: string): boolean {
  return keys.has(toTradingSymbol(raw));
}

export function extrasNameForTradingSymbol(raw: string): string | undefined {
  return nameMap.get(toTradingSymbol(raw));
}

export function getExtrasUniverseSorted(): StockSymbol[] {
  return [...EXTRAS_UNIVERSE].sort((a, b) =>
    toTradingSymbol(a.symbol).localeCompare(toTradingSymbol(b.symbol))
  );
}
