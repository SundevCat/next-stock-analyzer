"use client";

import { Activity, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StockTableSkeleton } from "@/components/StockTableSkeleton";
import { SuggestionBadge } from "@/components/SuggestionBadge";
import type { MarketId } from "@/lib/marketKind";
import type { StockListItem } from "@/types/stock";

type ListPayload = {
  stocks: StockListItem[];
  page: number;
  limit: number;
  totalUniverse: number;
  totalMatched?: number;
  enrichCapped?: boolean;
};

type Props = { market: MarketId };

/** First-view browse: small page size (Yahoo enrich only this slice). */
const BROWSE_PAGE_SIZE = 10;
/** Search results: up to this many rows per page (matches API cap). */
const SEARCH_PAGE_SIZE = 60;

export function StockMarketBrowser({ market }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<StockListItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [totalMatched, setTotalMatched] = useState<number | null>(null);
  const [enrichCapped, setEnrichCapped] = useState(false);
  const [limit, setLimit] = useState(BROWSE_PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  const searching = Boolean(debounced);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searching) {
      params.set("q", debounced);
      params.set("page", String(page));
      params.set("limit", String(SEARCH_PAGE_SIZE));
    } else {
      params.set("page", String(page));
      params.set("limit", String(BROWSE_PAGE_SIZE));
    }
    params.set("market", market);
    const res = await fetch(`/api/stocks?${params.toString()}`);
    const data = (await res.json()) as ListPayload;
    setRows(data.stocks);
    setTotal(data.totalUniverse);
    setTotalMatched(data.totalMatched ?? null);
    setEnrichCapped(Boolean(data.enrichCapped));
    if (data.limit) setLimit(data.limit);
    setLoading(false);
  }, [debounced, page, market, searching]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageTotal = searching ? (totalMatched ?? 0) : (total ?? 0);
  const end = Math.min(page * limit, pageTotal);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl flex-1">
          <label
            htmlFor="market-search"
            className="block text-xs font-medium uppercase tracking-wide text-slate-400"
          >
            Search symbol or company
          </label>
          <input
            id="market-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              market === "extras"
                ? "e.g. GSPC, XAUUSD, EURUSD"
                : market === "th"
                  ? "e.g. PTT or Thai stock name"
                  : "e.g. AAPL or Apple"
            }
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-emerald-500/0 transition focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      </div>

      {searching && enrichCapped && (
        <p className="text-xs text-amber-400/90">
          Match list is capped for performance; refine your search if needed.
        </p>
      )}

      {loading ? (
        <StockTableSkeleton
          lastColumn="favourite"
          rows={searching ? 8 : 10}
          label="Loading symbols and quotes"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-0 text-left text-xs md:min-w-[36rem] md:text-sm">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400 md:text-xs">
              <tr>
                <th className="px-2 py-2 font-medium md:px-4 md:py-3">
                  Symbol
                </th>
                <th className="w-12 px-1 py-2 text-center font-medium md:w-auto md:px-4 md:text-left">
                  <Activity
                    className="mx-auto h-4 w-4 text-slate-500 md:hidden"
                    aria-hidden
                  />
                  <span className="sr-only md:hidden">Suggestion</span>
                  <span className="hidden md:inline">Suggestion</span>
                </th>
                <th className="hidden font-medium md:table-cell md:px-4 md:py-3">
                  Name
                </th>
                <th className="px-2 py-2 text-right font-medium md:px-4 md:py-3">
                  Price
                </th>
                <th className="px-2 py-2 text-right font-medium md:px-4 md:py-3">
                  <div className="flex justify-end md:block">
                    <Star
                      className="h-4 w-4 text-amber-400/90 md:hidden"
                      aria-hidden
                      strokeWidth={2}
                    />
                    <span className="sr-only md:hidden">Favourite</span>
                    <span className="hidden md:inline">Favourite</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800" aria-live="polite">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No matches.
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr
                    key={s.tradingSymbol}
                    className="bg-slate-950/40 hover:bg-slate-900/60"
                  >
                    <td className="px-2 py-2.5 font-mono text-xs md:px-4 md:py-2 md:text-sm">
                      <Link
                        href={`/stocks/${encodeURIComponent(s.tradingSymbol)}?market=${market}`}
                        className="text-emerald-300 hover:underline"
                      >
                        {s.symbol}
                      </Link>
                    </td>
                    <td className="px-1 py-2 text-center align-middle md:whitespace-nowrap md:px-4 md:text-left">
                      <span className="inline-flex md:hidden">
                        <SuggestionBadge
                          variant="icon"
                          suggestion={s.suggestion}
                        />
                      </span>
                      <span className="hidden md:inline-block">
                        <SuggestionBadge suggestion={s.suggestion} />
                      </span>
                    </td>
                    <td className="hidden max-w-xs truncate px-4 py-2 text-slate-300 md:table-cell sm:max-w-md">
                      {s.name}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-[11px] text-slate-200 tabular-nums md:px-4 md:py-2 md:text-sm">
                      {s.price != null ? s.price.toFixed(2) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right align-middle md:px-4 md:py-2">
                      <FavoriteButton
                        symbol={s.tradingSymbol}
                        compact
                        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-600 px-2 py-1 text-xs font-medium text-slate-200 transition hover:border-amber-400/60 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 md:min-h-0 md:min-w-0"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {total != null && pageTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-300">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} · showing {(page - 1) * limit + 1}–{end}
            {searching ? (
              <>
                {" "}
                of {(totalMatched ?? 0).toLocaleString()}
              </>
            ) : (
              <span className="text-slate-400">
                {" "}
                · {BROWSE_PAGE_SIZE.toLocaleString()} per page
              </span>
            )}
          </span>
          <button
            type="button"
            disabled={loading || page * limit >= pageTotal}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex min-h-11 items-center rounded-lg border border-slate-700 px-3 py-2 hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
