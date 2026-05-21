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
  - RSI is **Wilder's** (recursive smoothing with `α = 1/period`), not Cutler's simple-average.
  - `horizon1to10` per-step direction is a **pure decayed signal** (`baseSign * confidence * decay * volBoost`) — no cosmetic sine ripple. A confidently bullish summary correctly produces 10 "up" cells with decreasing confidence; do not re-add oscillation.
  - Score inputs: EMA cross ±1, RSI ±0.5 / ±0.25, OLS slope ±0.75, **Tier-A candle pattern** ±0.6 (engulfing) / ±0.4 (hammer or shooting star with trend context) on the latest or penultimate bar only; doji on the latest bar multiplies confidence by 0.75. **Confidence divisor is 3.0** — recalibrate it whenever a new signal source is added.
- **Trend channel & rule break**: `computeTrendChannel(candles)` in `src/lib/chartRangeLevels.ts` returns a `TrendChannel` whose `lastBreak: ChannelBreak | null` flags when the most recently closed bar closed **above the upper line (`"breakout"`)** or **below the lower line (`"breakdown"`)**. Pivot-parallel is tried first; OLS envelope is the fallback. `StockChart.tsx` renders an amber/rose marker plus a Thai notice when `lastBreak` is set.
- **Candle patterns**: `detectCandlePatterns(candles, lookback?)` in `src/lib/chartPatterns.ts` returns `DetectedPattern[]` (chronological) — Tier-A only: bullish/bearish engulfing, hammer, shooting star, doji. The detector is the single source for pattern recognition; the prediction service folds the latest pattern into `score`/`rationale`, and `StockChart.tsx` renders an arrow / circle marker per pattern (`Engulf↑`, `Engulf↓`, `Hammer`, `Star`, `Doji`). **Types `DetectedPattern` and `CandlePatternKind` live in `types/stock.ts`** (not in `chartPatterns.ts`) — the detector imports them; do not reintroduce a circular re-export. Calibration constants: doji `|close-open|/range ≤ 0.03`; engulfing requires the previous bar's body to be ≥ 10 % of its range. `StockChart` caps visible pattern markers to the **most recent 10** to keep short timeframes readable.
- **Favourites**: Session cookie set in `src/middleware.ts`; API under `src/app/api/favorites/route.ts`; persistence in `favoritesRepository` (Mongo if `MONGODB_URI`, else in-memory).

## Hard rules

1. **No duplicated prediction logic** — import or call `predictFromCandles`; do not reimplement EMA/RSI/scoring in UI. If you need RSI elsewhere, use Wilder's formula (matches `predictionService.ts`) — not the simple average of last-N deltas.
2. **No duplicated trend logic** — reuse `computeTrendChannel` from `src/lib/chartRangeLevels.ts`; do not re-derive pivot-parallel / OLS envelopes or roll a parallel rule-break detector. The "rule break" is a strict **close-beyond-line** check on the latest closed bar; do not silently change to wick-based or multi-bar variants without asking.
3. **No duplicated candle-pattern logic** — reuse `detectCandlePatterns` from `src/lib/chartPatterns.ts`; do not re-derive engulfing/hammer/star/doji predicates in UI or other services. Adding a new pattern means extending `CandlePatternKind` + the detector + (probably) the score weights in `predictionService.ts`, in one place.
3. **Preserve behaviour** unless the task explicitly changes it: chart rendering (`lightweight-charts`), favourite toggles, dashboard structure.
4. **Symbols for Yahoo**: Uppercase/trim before chart API; index tickers may use `^` internally — **decode/sanitize for display and JSON** (e.g. URL-encoded `%5E` → readable form) in one shared helper under `src/lib/` if not already present.
5. **SEC / universe**: `getAllSecSymbols` / `getCachedSecSymbols`; Thailand rows in `src/data/thSecurities.ts` merged in `marketUniverseService.ts`.
6. **Scope**: Minimal diffs; match existing naming, Tailwind patterns, and `"use client"` boundaries.
7. **A11y baseline (WCAG 2.1 AA)** — when touching UI, do not regress:
   - Body / caption text: start at `text-slate-400` on dark surfaces. `text-slate-500` and `text-slate-600` are reserved for borders / dividers / decorative — never for readable text.
   - Interactive controls need `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-{emerald|amber}-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950` (emerald for general nav/buttons, amber for favourite-related).
   - Primary controls (buttons, links acting as buttons, pagination, timeframe pills) target ≥ 44 px height — use `min-h-11` + `inline-flex items-center`.
   - `<label>` must be linked to `<input>` via `htmlFor`/`id`.
   - Error surfaces use `role="alert"` + `aria-live="assertive"`; status / empty-state updates use `aria-live="polite"`.
   - Thai-content blocks are wrapped with `lang="th"`; chrome stays under root `<html lang="en">`.
   - Table `<thead>` uses `text-[11px] text-slate-400` minimum (not `text-[10px]` and not `text-slate-500`).

## Files to open first (by task)

| Task | Start here |
|------|------------|
| Stock list / universe | `StockMarketBrowser.tsx`, `api/stocks/route.ts`, `marketUniverseService.ts`, `data/thSecurities.ts` |
| Detail / chart / timeframe | `StockDetailClient.tsx`, `StockChart.tsx`, `lib/timeframes.ts` |
| Prediction API | `api/stocks/[symbol]/predict/route.ts`, `predictionService.ts` |
| Trend channel / rule-break | `lib/chartRangeLevels.ts` (compute), `StockChart.tsx` (render marker + notice) |
| Candle patterns | `lib/chartPatterns.ts` (detector), `predictionService.ts` (score wiring), `StockChart.tsx` (markers) |
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
