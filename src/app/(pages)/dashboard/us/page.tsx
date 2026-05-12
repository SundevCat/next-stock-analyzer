import Link from "next/link";
import { FavouritesEnrichedTable } from "@/components/FavouritesEnrichedTable";
import { marketOfSymbol } from "@/lib/marketKind";
import { isMongoConfigured } from "@/lib/mongodb";
import { getSessionId } from "@/lib/session";
import { listFavorites } from "@/repositories/favoritesRepository";

export const metadata = {
  title: "Favourites US · Stock Analyst",
};

export const dynamic = "force-dynamic";

export default async function FavouritesUsPage() {
  const sessionId = await getSessionId();
  const symbols = await listFavorites(sessionId);
  const usSyms = symbols.filter((s) => marketOfSymbol(s) === "us");
  const mongo = isMongoConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Favourites — United States
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          US-listed symbols you starred.{" "}
          {mongo ? (
            <span className="text-emerald-400/90">Stored in MongoDB.</span>
          ) : (
            <span>
              In-memory — set{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-xs text-slate-300">
                MONGODB_URI
              </code>{" "}
              to persist.
            </span>
          )}
        </p>
      </div>

      {usSyms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-16 text-center text-slate-500">
          No US favourites yet. Star symbols from a US chart or list.
          <div className="mt-4">
            <Link href="/stocks/us" className="text-emerald-400 hover:underline">
              US markets
            </Link>
          </div>
        </div>
      ) : (
        <FavouritesEnrichedTable market="us" />
      )}
    </div>
  );
}
