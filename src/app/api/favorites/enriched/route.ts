import { NextResponse } from "next/server";
import { getSessionId } from "@/lib/session";
import { getEnrichedFavoriteStocks } from "@/services/favoritesEnrichmentService";

export async function GET() {
  const sessionId = await getSessionId();
  const stocks = await getEnrichedFavoriteStocks(sessionId);
  return NextResponse.json({ stocks });
}
