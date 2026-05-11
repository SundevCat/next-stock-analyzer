import { getDb, isMongoConfigured } from "@/lib/mongodb";
import { toTradingSymbol } from "@/lib/symbolCodec";

type FavoritesDoc = {
  sessionId: string;
  symbols: string[];
  updatedAt: Date;
};

const memoryStore = new Map<string, Set<string>>();

const COLLECTION = "favorites";

function dedupeNormalized(symbols: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of symbols) {
    const t = toTradingSymbol(s);
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export async function listFavorites(sessionId: string): Promise<string[]> {
  const db = await getDb();
  if (db) {
    const doc = await db
      .collection<FavoritesDoc>(COLLECTION)
      .findOne({ sessionId });
    return dedupeNormalized(doc?.symbols ?? []);
  }
  const set = memoryStore.get(sessionId);
  return set ? dedupeNormalized([...set]) : [];
}

export async function addFavorite(sessionId: string, symbol: string): Promise<string[]> {
  const sym = toTradingSymbol(symbol);
  const db = await getDb();
  if (db) {
    await db.collection<FavoritesDoc>(COLLECTION).updateOne(
      { sessionId },
      {
        $addToSet: { symbols: sym },
        $set: { updatedAt: new Date() },
        $setOnInsert: { sessionId },
      },
      { upsert: true }
    );
    return listFavorites(sessionId);
  }
  let set = memoryStore.get(sessionId);
  if (!set) {
    set = new Set();
    memoryStore.set(sessionId, set);
  }
  set.add(sym);
  return listFavorites(sessionId);
}

export async function removeFavorite(sessionId: string, symbol: string): Promise<string[]> {
  const sym = toTradingSymbol(symbol);
  const db = await getDb();
  if (db) {
    await db.collection<FavoritesDoc>(COLLECTION).updateOne(
      { sessionId },
      { $pull: { symbols: sym }, $set: { updatedAt: new Date() } }
    );
    return listFavorites(sessionId);
  }
  memoryStore.get(sessionId)?.delete(sym);
  return listFavorites(sessionId);
}

export function favoritesPersistenceMode(): "mongodb" | "memory" {
  return isMongoConfigured() ? "mongodb" : "memory";
}
