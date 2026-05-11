import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionId } from "@/lib/session";
import { toTradingSymbol } from "@/lib/symbolCodec";
import {
  addFavorite,
  favoritesPersistenceMode,
  listFavorites,
  removeFavorite,
} from "@/repositories/favoritesRepository";

const bodySchema = z.object({
  symbol: z.string().min(1).max(48),
  action: z.enum(["add", "remove", "toggle"]),
});

export async function GET() {
  const sessionId = await getSessionId();
  const symbols = await listFavorites(sessionId);
  return NextResponse.json({
    symbols,
    persistence: favoritesPersistenceMode(),
  });
}

export async function POST(req: Request) {
  const sessionId = await getSessionId();
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { symbol, action } = parsed.data;
  const current = new Set(await listFavorites(sessionId));
  let nextList: string[];

  if (action === "add") {
    nextList = await addFavorite(sessionId, symbol);
  } else if (action === "remove") {
    nextList = await removeFavorite(sessionId, symbol);
  } else {
    const sym = toTradingSymbol(symbol);
    if (current.has(sym)) {
      nextList = await removeFavorite(sessionId, symbol);
    } else {
      nextList = await addFavorite(sessionId, symbol);
    }
  }

  return NextResponse.json({
    symbols: nextList,
    persistence: favoritesPersistenceMode(),
  });
}
