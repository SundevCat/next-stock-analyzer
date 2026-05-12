"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type FavoritesContextValue = {
  symbols: string[] | null;
  replaceSymbols: (next: string[]) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/** Deduplicate concurrent initial loads (e.g. React Strict Mode double-mount). */
let inFlight: Promise<string[]> | null = null;

async function fetchFavoritesSymbols(): Promise<string[]> {
  if (!inFlight) {
    inFlight = (async () => {
      const res = await fetch("/api/favorites", { credentials: "include" });
      if (!res.ok) return [];
      const data = (await res.json()) as { symbols: string[] };
      return data.symbols;
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [symbols, setSymbols] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await fetchFavoritesSymbols();
        if (!cancelled) setSymbols(next);
      } catch {
        if (!cancelled) setSymbols([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const replaceSymbols = useCallback((next: string[]) => {
    setSymbols(next);
  }, []);

  const value = useMemo(
    () => ({ symbols, replaceSymbols }),
    [symbols, replaceSymbols]
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
