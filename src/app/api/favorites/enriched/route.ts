import { NextRequest, NextResponse } from "next/server";
import type { MarketId } from "@/lib/marketKind";
import { getSessionId } from "@/lib/session";
import { getEnrichedFavoriteStocks } from "@/services/favoritesEnrichmentService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mp = searchParams.get("market");
  const market: MarketId | undefined =
    mp === "us" || mp === "th" || mp === "extras" ? mp : undefined;

  const sessionId = await getSessionId();
  const stocks = await getEnrichedFavoriteStocks(sessionId, market);
  return NextResponse.json({ stocks });
}
