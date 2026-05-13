"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { StockChart } from "@/components/StockChart";
import { StockDetailSkeleton } from "@/components/StockDetailSkeleton";
import { TIMEFRAMES } from "@/lib/timeframes";
import {
  directionSimpleTh,
  horizonHelpTh,
  horizonSectionTitleTh,
  summaryHeadlineTh,
} from "@/lib/predictionLabels";
import {
  favoritesDashboardPath,
  marketOfSymbol,
  marketsListPath,
} from "@/lib/marketKind";
import type { MarketId } from "@/lib/marketKind";
import { toDisplaySymbol, toTradingSymbol } from "@/lib/symbolCodec";
import type { Candle, PredictionResult, TimeframeId } from "@/types/stock";

type Props = { symbol: string };

export function StockDetailClient({ symbol }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tradingSymbol = useMemo(() => toTradingSymbol(symbol), [symbol]);
  const displaySymbol = useMemo(() => toDisplaySymbol(symbol), [symbol]);
  const tfParam = searchParams.get("tf") as TimeframeId | null;
  const fromFavorites = searchParams.get("from") === "favorites";
  const marketParam = searchParams.get("market") as MarketId | null;
  const inferredMarket = useMemo(
    () => marketOfSymbol(tradingSymbol),
    [tradingSymbol]
  );
  const effectiveMarket: MarketId =
    marketParam === "us" ||
    marketParam === "th" ||
    marketParam === "extras"
      ? marketParam
      : inferredMarket;

  const listHref = fromFavorites
    ? favoritesDashboardPath(effectiveMarket)
    : marketsListPath(effectiveMarket);
  const timeframe: TimeframeId = useMemo(() => {
    if (tfParam && TIMEFRAMES.some((t) => t.id === tfParam)) return tfParam;
    return "1d";
  }, [tfParam]);

  const [candles, setCandles] = useState<Candle[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(
    null
  );
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [exchangeName, setExchangeName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCompanyName(null);
    setCurrency(null);
    setExchangeName(null);
    const sym = encodeURIComponent(tradingSymbol);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`/api/stocks/${sym}/candles?timeframe=${timeframe}`),
        fetch(`/api/stocks/${sym}/predict?timeframe=${timeframe}`),
      ]);
      if (!cRes.ok) {
        const j = (await cRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Chart HTTP ${cRes.status}`);
      }
      if (!pRes.ok) {
        const j = (await pRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Predict HTTP ${pRes.status}`);
      }
      const cJson = (await cRes.json()) as {
        candles: Candle[];
        companyName?: string | null;
        currency?: string | null;
        exchangeName?: string | null;
      };
      const pJson = (await pRes.json()) as { prediction: PredictionResult };
      setCandles(cJson.candles);
      setCompanyName(cJson.companyName ?? null);
      setCurrency(cJson.currency ?? null);
      setExchangeName(cJson.exchangeName ?? null);
      setPrediction(pJson.prediction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setCandles([]);
      setPrediction(null);
      setCompanyName(null);
      setCurrency(null);
      setExchangeName(null);
    } finally {
      setLoading(false);
    }
  }, [timeframe, tradingSymbol]);

  useEffect(() => {
    void load();
  }, [load]);

  const setTimeframe = (next: TimeframeId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tf", next);
    router.push(
      `/stocks/${encodeURIComponent(tradingSymbol)}?${params.toString()}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">
            Symbol
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {displaySymbol}
          </h1>
          {companyName && (
            <p className="mt-2 max-w-3xl text-base leading-snug text-slate-300">
              {companyName}
            </p>
          )}
          {(exchangeName || currency || tradingSymbol !== displaySymbol) && (
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
              {exchangeName && (
                <div className="flex gap-2">
                  <dt className="text-slate-600">ตลาด</dt>
                  <dd className="text-slate-400">{exchangeName}</dd>
                </div>
              )}
              {currency && (
                <div className="flex gap-2">
                  <dt className="text-slate-600">สกุลเงิน</dt>
                  <dd className="font-mono text-slate-400">{currency}</dd>
                </div>
              )}
              {tradingSymbol !== displaySymbol && (
                <div className="flex gap-2">
                  <dt className="text-slate-600">รหัสซื้อขาย</dt>
                  <dd className="font-mono text-slate-400">{tradingSymbol}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FavoriteButton symbol={tradingSymbol} />
          <Link
            href={listHref}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
          >
            {fromFavorites ? "Back to favourites" : "Back to list"}
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIMEFRAMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTimeframe(t.id)}
            className={
              timeframe === t.id
                ? "rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300 ring-1 ring-emerald-500/50"
                : "rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <StockDetailSkeleton label="Loading chart and signal analysis" />
      ) : candles.length === 0 ? (
        <div className="rounded-xl border border-slate-800 py-20 text-center text-slate-500">
          No candle data for this timeframe.
        </div>
      ) : (
        <>
          <StockChart
            candles={candles}
            prediction={prediction}
            timeframe={timeframe}
          />

          {prediction && (
            <section className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-5 sm:grid-cols-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  สัญญาณจากกราฟ
                </h2>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {summaryHeadlineTh(prediction.summary)}{" "}
                  <span className="text-base font-normal text-slate-400">
                    (โมเดลมั่นใจประมาณ {(prediction.confidence * 100).toFixed(0)}
                    %)
                  </span>
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-400">
                  {prediction.rationale.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  {horizonSectionTitleTh(timeframe)}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {horizonHelpTh(timeframe)}
                </p>
                <div className="mt-4 grid grid-cols-5 gap-x-2 gap-y-3 sm:grid-cols-5">
                  {prediction.horizon1to10.map((h) => (
                    <div
                      key={h.step}
                      className={`rounded-lg px-2 py-2 text-center text-xs leading-tight ${
                        h.direction === "up"
                          ? "bg-emerald-500/15 text-emerald-200"
                          : h.direction === "down"
                            ? "bg-red-500/15 text-red-200"
                            : "bg-slate-700/40 text-slate-300"
                      }`}
                    >
                      <div className="font-mono text-[10px] text-slate-500">
                        ช่วง {h.step}
                      </div>
                      <div className="mt-1 font-semibold">
                        {directionSimpleTh(h.direction)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        ~{(h.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <dt>RSI(14)</dt>
                  <dd className="font-mono text-slate-300">
                    {prediction.metrics.rsi14?.toFixed(1) ?? "—"}
                  </dd>
                  <dt>EMA12 / EMA26</dt>
                  <dd className="font-mono text-slate-300">
                    {prediction.metrics.ema12?.toFixed(2) ?? "—"} /{" "}
                    {prediction.metrics.ema26?.toFixed(2) ?? "—"}
                  </dd>
                  <dt>ราคาปิดล่าสุด</dt>
                  <dd className="font-mono text-slate-300">
                    {prediction.metrics.lastClose?.toFixed(2) ?? "—"}
                  </dd>
                </dl>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
