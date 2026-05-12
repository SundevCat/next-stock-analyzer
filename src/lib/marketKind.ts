import { toTradingSymbol } from "@/lib/symbolCodec";

export type MarketId = "us" | "th";

/** Thailand names on Yahoo use the `.BK` suffix (SET). */
export function isThailandTradingSymbol(raw: string): boolean {
  return toTradingSymbol(raw).endsWith(".BK");
}

export function marketOfSymbol(raw: string): MarketId {
  return isThailandTradingSymbol(raw) ? "th" : "us";
}

export function marketsListPath(market: MarketId): string {
  return market === "th" ? "/stocks/th" : "/stocks/us";
}

export function favoritesDashboardPath(market: MarketId): string {
  return market === "th" ? "/dashboard/th" : "/dashboard/us";
}
