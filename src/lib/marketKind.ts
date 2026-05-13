import { toTradingSymbol } from "@/lib/symbolCodec";

export type MarketId = "us" | "th" | "extras";


/** Thailand names on Yahoo use the `.BK` suffix (SET). */
export function isThailandTradingSymbol(raw: string): boolean {
  return toTradingSymbol(raw).endsWith(".BK");
}

/** US-listed vs Thailand-listed (for equities / broad universe). Funds & commodities catalog uses `/stocks/extras` separately. */
export function marketOfSymbol(raw: string): "us" | "th" {
  return isThailandTradingSymbol(raw) ? "th" : "us";
}

export function marketsListPath(market: MarketId): string {
  if (market === "th") return "/stocks/th";
  if (market === "extras") return "/stocks/extras";
  return "/stocks/us";
}

export function favoritesDashboardPath(market: MarketId): string {
  if (market === "th") return "/dashboard/th";
  if (market === "extras") return "/dashboard/extras";
  return "/dashboard/us";
}
