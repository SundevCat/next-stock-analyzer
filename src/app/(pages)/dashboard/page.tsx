import Link from "next/link";
import { FavouritesEnrichedTable } from "@/components/FavouritesEnrichedTable";
import { isMongoConfigured } from "@/lib/mongodb";
import { getSessionId } from "@/lib/session";
import { listFavorites } from "@/repositories/favoritesRepository";

export const metadata = {
  title: "Favourites · Stock Analyst",
};

/** Session-bound page; avoid static caching of empty/wrong favourites. */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessionId = await getSessionId();
  const symbols = await listFavorites(sessionId);
  const mongo = isMongoConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Favourites</h1>
        <p className="mt-1 text-sm text-slate-400">
          Favourites for your session.{" "}
          {mongo ? (
            <span className="text-emerald-400/90">Stored in MongoDB.</span>
          ) : (
            <span>
              Using in-memory storage — set{" "}
              <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-xs text-slate-300">
                MONGODB_URI
              </code>{" "}
              for persistence.
            </span>
          )}
        </p>
      </div>

      {symbols.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-16 text-center text-slate-500">
          No favourites yet. Star symbols from a chart page.
          <div className="mt-4">
            <Link
              href="/stocks"
              className="text-emerald-400 hover:underline"
            >
              Browse markets
            </Link>
          </div>
        </div>
      ) : (
        <FavouritesEnrichedTable />
      )}
    </div>
  );
}
