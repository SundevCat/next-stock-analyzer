"use client";

import { Activity, LineChart } from "lucide-react";
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
          className={`w-full min-w-0 text-left text-xs md:text-sm ${showDelete ? "md:min-w-[42rem]" : "md:min-w-[36rem]"}`}
        >
          <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wide text-slate-500 md:text-xs">
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
                  <LineChart
                    className="h-4 w-4 text-slate-500 md:hidden"
                    aria-hidden
                  />
                  <span className="sr-only md:hidden">Chart</span>
                  <span className="hidden md:inline">Chart</span>
                </div>
              </th>
              {showDelete ? (
                <th className="w-12 px-1 py-2 text-right font-medium md:w-11 md:px-1 md:py-3">
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
                  <td className="px-2 py-2.5 font-mono text-xs md:px-4 md:py-2 md:text-sm">
                    <Link
                      href={`/stocks/${encodeURIComponent(s.tradingSymbol)}?from=favorites&market=${market}`}
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
                    <Link
                      href={`/stocks/${encodeURIComponent(s.tradingSymbol)}?from=favorites&market=${market}`}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-900/80 hover:text-slate-300 md:min-h-0 md:min-w-0 md:text-sm md:text-slate-500"
                      aria-label={`Open chart for ${s.symbol}`}
                      title="View chart"
                    >
                      <LineChart
                        className="h-5 w-5 md:hidden"
                        strokeWidth={2}
                        aria-hidden
                      />
                      <span className="hidden md:inline">View →</span>
                    </Link>
                  </td>
                  {showDelete ? (
                    <td className="px-1 py-2 text-right align-middle md:px-1">
                      <button
                        type="button"
                        disabled={removing === s.tradingSymbol}
                        title="ลบออกจากรายการโปรด"
                        aria-label={`ลบ ${s.symbol} ออกจากรายการโปรด`}
                        onClick={() => confirmAndRemove(s)}
                        className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border border-red-900/50 p-2 text-red-300 transition hover:border-red-500/60 hover:bg-red-950/40 disabled:opacity-50 md:min-h-0 md:min-w-0 md:p-1"
                      >
                        {removing === s.tradingSymbol ? (
                          <span className="px-0.5 text-[10px] leading-none">
                            …
                          </span>
                        ) : (
                          <TrashIcon className="h-4 w-4 md:h-3 md:w-3" />
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
