import Link from "next/link";
import { FavouritesEnrichedTable } from "@/components/FavouritesEnrichedTable";
import { marketOfSymbol } from "@/lib/marketKind";
import { getSessionId } from "@/lib/session";
import { listFavorites } from "@/repositories/favoritesRepository";

export const metadata = {
  title: "Favourites Thailand · Stock Analyst",
};

export const dynamic = "force-dynamic";

export default async function FavouritesThPage() {
  const sessionId = await getSessionId();
  const symbols = await listFavorites(sessionId);
  const thSyms = symbols.filter((s) => marketOfSymbol(s) === "th");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Favourites — Thailand
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Thai symbols you starred.
        </p>
      </div>

      {thSyms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-16 text-center text-slate-500">
          No Thailand favourites yet. Star a Thai ticker (e.g. PTT).
          <div className="mt-4">
            <Link href="/stocks/th" className="text-emerald-400 hover:underline">
              Thailand markets
            </Link>
          </div>
        </div>
      ) : (
        <FavouritesEnrichedTable market="th" />
      )}
    </div>
  );
}
