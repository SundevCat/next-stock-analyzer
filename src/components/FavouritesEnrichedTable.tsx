"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { MarketId } from "@/lib/marketKind";
import { StockTableSkeleton } from "@/components/StockTableSkeleton";
import { SuggestionBadge } from "@/components/SuggestionBadge";
import type { StockListItem } from "@/types/stock";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

type Props = { market: MarketId };

export function FavouritesEnrichedTable({ market }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<StockListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/favorites/enriched?market=${encodeURIComponent(market)}`,
          {
            credentials: "include",
          }
        );
        const json = (await res.json().catch(() => ({}))) as {
          stocks?: StockListItem[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }
        if (!cancelled) setRows(json.stocks ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [market]);

  useEffect(() => {
    if (rows !== null && rows.length === 0) setEditMode(false);
  }, [rows]);

  const removeFavorite = useCallback(
    async (tradingSymbol: string) => {
      setRemoving(tradingSymbol);
      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ symbol: tradingSymbol, action: "remove" }),
        });
        if (!res.ok) return;
        setRows((prev) =>
          (prev ?? []).filter((r) => r.tradingSymbol !== tradingSymbol)
        );
        router.refresh();
      } finally {
        setRemoving(null);
      }
    },
    [router]
  );

  const confirmAndRemove = useCallback(
    (row: StockListItem) => {
      const ok = window.confirm(
        `ลบ ${row.symbol} ออกจากรายการโปรดหรือไม่?`
      );
      if (!ok) return;
      void removeFavorite(row.tradingSymbol);
    },
    [removeFavorite]
  );

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (rows === null) {
    return (
      <StockTableSkeleton
        lastColumn="chart"
        rows={10}
        label="Loading favourites, prices and suggestions"
      />
    );
  }

  const showDelete = editMode;
  const colCount = showDelete ? 6 : 5;

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setEditMode((v) => !v)}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-emerald-500/50 hover:text-emerald-200"
          >
            {editMode ? "เสร็จสิ้น" : "แก้ไข"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table
          className={`w-full text-left text-sm ${showDelete ? "min-w-[42rem]" : "min-w-[36rem]"}`}
        >
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                Suggestion
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Chart</th>
              {showDelete ? (
                <th className="w-11 px-1 py-3 text-right font-medium">
                  <span className="sr-only">ลบออกจากโปรด</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No favourites left.
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
                      href={`/stocks/${encodeURIComponent(s.tradingSymbol)}?from=favorites&market=${market}`}
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
                    <Link
                      href={`/stocks/${encodeURIComponent(s.tradingSymbol)}?from=favorites&market=${market}`}
                      className="text-sm text-slate-500 hover:text-slate-300"
                    >
                      View →
                    </Link>
                  </td>
                  {showDelete ? (
                    <td className="px-1 py-2 text-right align-middle">
                      <button
                        type="button"
                        disabled={removing === s.tradingSymbol}
                        title="ลบออกจากรายการโปรด"
                        aria-label={`ลบ ${s.symbol} ออกจากรายการโปรด`}
                        onClick={() => confirmAndRemove(s)}
                        className="inline-flex items-center justify-center rounded-md border border-red-900/50 p-1 text-red-300 transition hover:border-red-500/60 hover:bg-red-950/40 disabled:opacity-50"
                      >
                        {removing === s.tradingSymbol ? (
                          <span className="px-0.5 text-[10px] leading-none">
                            …
                          </span>
                        ) : (
                          <TrashIcon className="h-3 w-3" />
                        )}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
