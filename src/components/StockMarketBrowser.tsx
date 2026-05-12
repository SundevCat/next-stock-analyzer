"use client";

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

export function StockMarketBrowser({ market }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<StockListItem[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [totalMatched, setTotalMatched] = useState<number | null>(null);
  const [enrichCapped, setEnrichCapped] = useState(false);
  const [limit, setLimit] = useState(60);
  const [loading, setLoading] = useState(true);

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
    if (debounced) params.set("q", debounced);
    else {
      params.set("page", String(page));
      params.set("limit", "60");
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
  }, [debounced, page, market]);
  useEffect(() => {
    void load();
  }, [load]);

  const end = Math.min(page * limit, total ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl flex-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Search symbol or company
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              market === "th"
                ? "e.g. PTT.BK or Thai stock name"
                : "e.g. AAPL or Apple"
            }
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none ring-emerald-500/0 transition focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        {!debounced && total != null && (
          <p className="text-sm text-slate-400">
            Listed in app:{" "}
            <span className="font-mono text-slate-200">
              {total.toLocaleString()}
            </span>{" "}
            <span className="text-slate-500">
              (
              {market === "th"
                ? "Thailand SET / Yahoo .BK"
                : "United States SEC universe"}
              )
            </span>
          </p>
        )}
      </div>

      {debounced && enrichCapped && totalMatched != null && (
        <p className="text-xs text-amber-400/90">
          Quotes and signals shown for the first {rows.length} of{" "}
          {totalMatched.toLocaleString()} matches (cap for performance).
        </p>
      )}

      {loading ? (
        <StockTableSkeleton
          lastColumn="favourite"
          rows={10}
          label="Loading symbols and quotes"
        />
      ) : (
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                Suggestion
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Favourite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-slate-500"
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
                  <td className="px-4 py-2 font-mono">
                    <Link
                      href={`/stocks/${encodeURIComponent(s.tradingSymbol)}?market=${market}`}
                      className="text-emerald-300 hover:underline"
                    >
                      {s.symbol}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <SuggestionBadge suggestion={s.suggestion} />
                  </td>
                  <td className="max-w-xs truncate px-4 py-2 text-slate-300 sm:max-w-md">
                    {s.name}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-slate-200">
                    {s.price != null ? s.price.toFixed(2) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <FavoriteButton
                      symbol={s.tradingSymbol}
                      compact
                      className="inline-flex rounded-lg border border-slate-600 px-2 py-1 text-xs font-medium text-slate-200 transition hover:border-amber-400/60 hover:text-amber-200 disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      {!debounced && total != null && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-700 px-3 py-1.5 hover:border-slate-500 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} · showing {(page - 1) * limit + 1}–{end} of{" "}
            {total.toLocaleString()}
          </span>
          <button
            type="button"
            disabled={loading || page * limit >= total}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 hover:border-slate-500 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
