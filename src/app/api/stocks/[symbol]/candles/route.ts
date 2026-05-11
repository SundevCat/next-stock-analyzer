import { NextRequest, NextResponse } from "next/server";
import { toDisplaySymbol, toTradingSymbol } from "@/lib/symbolCodec";
import { fetchYahooCandles } from "@/services/yahooFinanceService";
import type { TimeframeId } from "@/types/stock";

const ALLOWED = new Set<TimeframeId>([
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
  "1wk",
  "1mo",
  "3mo",
]);

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await ctx.params;
  const tfParam =
    new URL(req.url).searchParams.get("timeframe") ?? "1d";
  if (!ALLOWED.has(tfParam as TimeframeId)) {
    return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
  }
  const timeframe = tfParam as TimeframeId;
  try {
    const trading = toTradingSymbol(symbol);
    const candles = await fetchYahooCandles(trading, timeframe);
    return NextResponse.json({
      symbol: toDisplaySymbol(symbol),
      tradingSymbol: trading,
      timeframe,
      candles,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upstream error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
