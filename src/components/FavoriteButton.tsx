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
        "rounded-lg border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-amber-400/60 hover:text-amber-200 disabled:opacity-50"
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
        <span className="ml-2 text-xs text-slate-500">
          {on ? "saved" : "track on dashboard"}
        </span>
      )}
    </button>
  );
}
