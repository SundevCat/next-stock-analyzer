"use client";

import { useEffect, useRef } from "react";
import type { UTCTimestamp } from "lightweight-charts";
import { chartMarkerTextTh } from "@/lib/predictionLabels";
import { timeframeBarSeconds } from "@/lib/timeframes";
import type { Candle, PredictionResult, TimeframeId } from "@/types/stock";

type Props = {
  candles: Candle[];
  prediction: PredictionResult | null;
  timeframe: TimeframeId;
};

export function StockChart({ candles, prediction, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    const cleanupRef: { fn?: () => void } = {};

    void (async () => {
      const {
        createChart,
        CandlestickSeries,
        LineSeries,
        ColorType,
        CrosshairMode,
        LineStyle,
        createSeriesMarkers,
      } = await import("lightweight-charts");

      if (disposed || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        width: el.clientWidth,
        height: 420,
        layout: {
          background: { type: ColorType.Solid, color: "#0f172a" },
          textColor: "#e2e8f0",
        },
        grid: {
          vertLines: { color: "rgba(148, 163, 184, 0.12)" },
          horzLines: { color: "rgba(148, 163, 184, 0.12)" },
        },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false, fixRightEdge: false },
        crosshair: { mode: CrosshairMode.Normal },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#34d399",
        downColor: "#f87171",
        borderVisible: false,
        wickUpColor: "#34d399",
        wickDownColor: "#f87171",
      });

      const chartData = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      candleSeries.setData(chartData);

      const forecastSeries = chart.addSeries(LineSeries, {
        color: "rgba(96, 165, 250, 0.85)",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lastValueVisible: false,
        priceLineVisible: false,
      });

      const last = candles[candles.length - 1];
      const penultimate = candles[candles.length - 2];
      if (last && prediction && prediction.horizon1to10.length > 0) {
        const delta =
          penultimate && last.time > penultimate.time
            ? last.time - penultimate.time
            : timeframeBarSeconds(timeframe);

        const forecastPoints: { time: UTCTimestamp; value: number }[] = [];
        let v = last.close;
        forecastPoints.push({ time: last.time as UTCTimestamp, value: v });

        /** Per-step tilt from horizon (matches detail grid); avoids single average → always slopes one way */
        const clampPct = (n: number, lo: number, hi: number) =>
          Math.max(lo, Math.min(hi, n));

        for (let step = 1; step <= 10; step++) {
          const h = prediction.horizon1to10[step - 1];
          if (!h) break;
          const t = (last.time + delta * step) as UTCTimestamp;
          const dirSign = h.direction === "up" ? 1 : h.direction === "down" ? -1 : 0;
          const baseMag = prediction.confidence * 0.0009 * (0.85 + h.confidence);
          const stepPct =
            dirSign *
            clampPct(baseMag, 0.00015, prediction.summary === "neutral" ? 0.004 : 0.007);
          v *= 1 + stepPct;
          forecastPoints.push({ time: t, value: v });
        }
        forecastSeries.setData(forecastPoints);
      } else {
        forecastSeries.setData([]);
      }

      const markerPlugin = createSeriesMarkers(candleSeries, []);
      if (last && prediction) {
        const isBull = prediction.summary === "bullish";
        const isBear = prediction.summary === "bearish";
        const shape = isBull ? "arrowUp" : isBear ? "arrowDown" : "circle";
        const color = isBull ? "#34d399" : isBear ? "#f87171" : "#facc15";
        const label = chartMarkerTextTh(prediction.summary);
        markerPlugin.setMarkers([
          {
            time: last.time as UTCTimestamp,
            position: isBear ? "aboveBar" : "belowBar",
            color,
            shape,
            text: label,
          },
        ]);
      } else {
        markerPlugin.setMarkers([]);
      }

      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => {
        chart.applyOptions({
          width: el.clientWidth,
          height: el.clientHeight,
        });
      });
      ro.observe(el);

      cleanupRef.fn = () => {
        ro.disconnect();
        chart.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanupRef.fn?.();
    };
  }, [candles, prediction, timeframe]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full min-h-[320px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
    />
  );
}
