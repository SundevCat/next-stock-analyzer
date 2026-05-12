---
name: stock-analyzer
description: >-
  Conventions for the stock-analyzer Next.js app: App Router layout, Yahoo/SEC
  data, prediction service, favourites with session/MongoDB, charts, and safe
  symbol handling. Use when editing this repo's pages, APIs, services, or types.
---

# stock-analyzer — Agent Skill

Use this skill when implementing or fixing features in **this repository** (US stock browser, charts, predictions, favourites).

## When to apply

- Changing `src/app/(pages)/**`, `src/components/**`, or `src/app/api/**`
- Touching `yahooFinanceService`, `secSymbolsService`, `marketUniverseService`, `predictionService`, `favoritesRepository`
- Adding list/detail fields (price, suggestion, symbol display), caching, or API response shapes

## Architecture quick map

- **List & search**: `GET /api/stocks` uses `getAllMarketSymbols()` (US SEC + Thailand static list) with optional `yahooSearchSymbols(q)`; pagination when no `q`.
- **Charts**: `fetchYahooCandles(symbol, timeframe)` → `GET /api/stocks/[symbol]/candles` (or inline usage in server components).
- **Prediction**: `predictFromCandles(candles)` in `src/services/predictionService.ts` — **single source of truth** for bullish/bearish/neutral and rationale. Reuse this for any “suggestion” (list or detail), e.g. by calling the same function on a candle series or the existing predict route.
- **Favourites**: Session cookie set in `src/middleware.ts`; API under `src/app/api/favorites/route.ts`; persistence in `favoritesRepository` (Mongo if `MONGODB_URI`, else in-memory).

## Hard rules

1. **No duplicated prediction logic** — import or call `predictFromCandles`; do not reimplement EMA/RSI/scoring in UI.
2. **Preserve behaviour** unless the task explicitly changes it: chart rendering (`lightweight-charts`), favourite toggles, dashboard structure.
3. **Symbols for Yahoo**: Uppercase/trim before chart API; index tickers may use `^` internally — **decode/sanitize for display and JSON** (e.g. URL-encoded `%5E` → readable form) in one shared helper under `src/lib/` if not already present.
4. **SEC / universe**: `getAllSecSymbols` / `getCachedSecSymbols`; Thailand rows in `src/data/thSecurities.ts` merged in `marketUniverseService.ts`.
5. **Scope**: Minimal diffs; match existing naming, Tailwind patterns, and `"use client"` boundaries.

## Files to open first (by task)

| Task | Start here |
|------|------------|
| Stock list / universe | `StockMarketBrowser.tsx`, `api/stocks/route.ts`, `marketUniverseService.ts`, `data/thSecurities.ts` |
| Detail / chart / timeframe | `StockDetailClient.tsx`, `StockChart.tsx`, `lib/timeframes.ts` |
| Prediction API | `api/stocks/[symbol]/predict/route.ts`, `predictionService.ts` |
| Favourites | `FavoriteButton.tsx`, `api/favorites/route.ts`, `favoritesRepository.ts` |
| Session | `middleware.ts`, `lib/session.ts` |

## Commands

```bash
npm run dev
npm run lint
npm run build
```

## Verification (before finishing any code change)

Run **both** commands until they succeed:

```bash
npm run lint
npm run build
```

Treat the task as **incomplete** if either fails — fix errors and re-run. This catches type errors, ESLint issues, and Next.js build failures that `dev` alone may miss.

## Env

See `.env.example`: optional `MONGODB_URI`; Yahoo overrides rarely needed.
