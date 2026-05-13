import Link from "next/link";
import { FavouritesEnrichedTable } from "@/components/FavouritesEnrichedTable";
import { isExtrasSymbol } from "@/data/extrasUniverse";
import { getSessionId } from "@/lib/session";
import { listFavorites } from "@/repositories/favoritesRepository";

export const metadata = {
  title: "Favourites funds & commodities · Stock Analyst",
};

export const dynamic = "force-dynamic";

export default async function FavouritesExtrasPage() {
  const sessionId = await getSessionId();
  const symbols = await listFavorites(sessionId);
  const extraSyms = symbols.filter((s) => isExtrasSymbol(s));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Favourites — funds &amp; commodities
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Starred symbols from the funds &amp; gold catalog (GLD, GC=F, SET
          ETFs, etc.).
        </p>
      </div>

      {extraSyms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 py-16 text-center text-slate-500">
          No favourites in this category yet. Open the catalog and star a
          ticker.
          <div className="mt-4">
            <Link
              href="/stocks/extras"
              className="text-emerald-400 hover:underline"
            >
              Funds &amp; commodities
            </Link>
          </div>
        </div>
      ) : (
        <FavouritesEnrichedTable market="extras" />
      )}
    </div>
  );
}
