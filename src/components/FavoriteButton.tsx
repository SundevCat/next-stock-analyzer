"use client";

import { useFavorites } from "@/components/FavoritesProvider";
import { toTradingSymbol } from "@/lib/symbolCodec";

type Props = {
  symbol: string;
  className?: string;
  compact?: boolean;
};

export function FavoriteButton({ symbol, className, compact }: Props) {
  const { symbols, replaceSymbols } = useFavorites();
  const key = toTradingSymbol(symbol);

  const on = symbols?.includes(key) ?? false;
  const busy = symbols === null;

  const toggle = async () => {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ symbol: key, action: "toggle" }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { symbols: string[] };
    replaceSymbols(data.symbols);
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      className={
        className ??
        "inline-flex min-h-11 items-center rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400/60 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50"
      }
    >
      {busy ? (
        "…"
      ) : compact ? (
        on ? (
          "★"
        ) : (
          "☆"
        )
      ) : on ? (
        "★ Favourite"
      ) : (
        "☆ Add favourite"
      )}
      {!busy && !compact && (
        <span className="ml-2 text-xs text-slate-400">
          {on ? "saved" : "track on dashboard"}
        </span>
      )}
    </button>
  );
}
