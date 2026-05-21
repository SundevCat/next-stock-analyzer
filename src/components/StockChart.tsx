"use client";

import { useEffect, useMemo, useRef } from "react";
import type { IPriceLine, UTCTimestamp } from "lightweight-charts";
import {
  computeTradingRangeLevels,
  computeTrendChannel,
  formatChartPrice,
} from "@/lib/chartRangeLevels";
import { chartMarkerTextTh } from "@/lib/predictionLabels";
import { timeframeBarSeconds } from "@/lib/timeframes";
import type {
  Candle,
  DetectedPattern,
  PredictionResult,
  TimeframeId,
} from "@/types/stock";

function patternShortLabel(kind: DetectedPattern["kind"]): string {
  switch (kind) {
    case "bullish_engulfing":
      return "Engulf↑";
    case "bearish_engulfing":
      return "Engulf↓";
    case "hammer":
      return "Hammer";
    case "shooting_star":
      return "Star";
    case "doji":
      return "Doji";
  }
}

type Props = {
  candles: Candle[];
  prediction: PredictionResult | null;
  timeframe: TimeframeId;
};

export function StockChart({ candles, prediction, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rangeLevels = useMemo(
    () => computeTradingRangeLevels(candles),
    [candles]
  );

  const trendChannel = useMemo(
    () => computeTrendChannel(candles),
    [candles]
  );

  const refClose =
    candles.length > 0 ? candles[candles.length - 1]!.close : 0;

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

      const srPriceLines: IPriceLine[] = [];
      if (rangeLevels) {
        srPriceLines.push(
          candleSeries.createPriceLine({
            price: rangeLevels.resistance,
            color: "rgba(248, 113, 113, 0.92)",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "Resistance",
          })
        );
        srPriceLines.push(
          candleSeries.createPriceLine({
            price: rangeLevels.support,
            color: "rgba(52, 211, 153, 0.92)",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "Support",
          })
        );
        srPriceLines.push(
          candleSeries.createPriceLine({
            price: rangeLevels.midpoint,
            color: "rgba(148, 163, 184, 0.4)",
            lineWidth: 1,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false,
            title: "",
          })
        );
      }

      const pivotUp =
        trendChannel?.method === "pivot_parallel" &&
        trendChannel.trend === "up";
      const pivotDown =
        trendChannel?.method === "pivot_parallel" &&
        trendChannel.trend === "down";

      const trendUpperSeries = chart.addSeries(LineSeries, {
        color: "rgba(251, 191, 36, 0.9)",
        lineWidth: 2,
        lineStyle: pivotUp ? LineStyle.Dashed : LineStyle.Solid,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      const trendLowerSeries = chart.addSeries(LineSeries, {
        color: "rgba(45, 212, 191, 0.88)",
        lineWidth: 2,
        lineStyle: pivotDown ? LineStyle.Dashed : LineStyle.Solid,
        lastValueVisible: false,
        priceLineVisible: false,
      });

      if (trendChannel) {
        const { upper, lower } = trendChannel;
        trendUpperSeries.setData([
          {
            time: upper.timeStart as UTCTimestamp,
            value: upper.priceStart,
          },
          {
            time: upper.timeEnd as UTCTimestamp,
            value: upper.priceEnd,
          },
        ]);
        trendLowerSeries.setData([
          {
            time: lower.timeStart as UTCTimestamp,
            value: lower.priceStart,
          },
          {
            time: lower.timeEnd as UTCTimestamp,
            value: lower.priceEnd,
          },
        ]);
      } else {
        trendUpperSeries.setData([]);
        trendLowerSeries.setData([]);
      }

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
      const markers: Parameters<typeof markerPlugin.setMarkers>[0] = [];
      if (last && prediction) {
        const isBull = prediction.summary === "bullish";
        const isBear = prediction.summary === "bearish";
        const shape = isBull ? "arrowUp" : isBear ? "arrowDown" : "circle";
        const color = isBull ? "#34d399" : isBear ? "#f87171" : "#facc15";
        const label = chartMarkerTextTh(prediction.summary);
        markers.push({
          time: last.time as UTCTimestamp,
          position: isBear ? "aboveBar" : "belowBar",
          color,
          shape,
          text: label,
        });
      }
      if (trendChannel?.lastBreak) {
        const b = trendChannel.lastBreak;
        markers.push({
          time: b.time as UTCTimestamp,
          position: b.type === "breakout" ? "aboveBar" : "belowBar",
          color: b.type === "breakout" ? "#fbbf24" : "#fb7185",
          shape: b.type === "breakout" ? "arrowUp" : "arrowDown",
          text: b.type === "breakout" ? "เบรกขึ้น" : "เบรกลง",
        });
      }
      if (prediction?.patterns?.length) {
        /** Show only the most recent patterns so short timeframes do not get peppered with doji circles. */
        const visiblePatterns = prediction.patterns.slice(-10);
        for (const p of visiblePatterns) {
          markers.push({
            time: p.time as UTCTimestamp,
            position: p.bias === "bearish" ? "aboveBar" : "belowBar",
            color:
              p.bias === "bullish"
                ? "#34d399"
                : p.bias === "bearish"
                  ? "#f87171"
                  : "#fbbf24",
            shape:
              p.kind === "doji"
                ? "circle"
                : p.bias === "bullish"
                  ? "arrowUp"
                  : "arrowDown",
            text: patternShortLabel(p.kind),
          });
        }
      }
      markerPlugin.setMarkers(markers);

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
        for (const pl of srPriceLines) {
          candleSeries.removePriceLine(pl);
        }
        chart.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanupRef.fn?.();
    };
  }, [candles, prediction, timeframe, rangeLevels, trendChannel]);

  const rangePctOfMid =
    rangeLevels && rangeLevels.midpoint > 0
      ? (
          ((rangeLevels.resistance - rangeLevels.support) /
            rangeLevels.midpoint) *
          100
        ).toFixed(2)
      : null;

  const upperTrendPct =
    trendChannel && trendChannel.upper.priceStart > 0
      ? (
          ((trendChannel.upper.priceEnd - trendChannel.upper.priceStart) /
            trendChannel.upper.priceStart) *
          100
        ).toFixed(2)
      : null;
  const lowerTrendPct =
    trendChannel && trendChannel.lower.priceStart > 0
      ? (
          ((trendChannel.lower.priceEnd - trendChannel.lower.priceStart) /
            trendChannel.lower.priceStart) *
          100
        ).toFixed(2)
      : null;

  const trendChannelBlurb =
    trendChannel?.method === "pivot_parallel"
      ? trendChannel.trend === "up"
        ? "ขาขึ้น: เชื่อม 2 พีว็อทต่ำล่าสุดที่สูงขึ้น (higher lows) แล้วเลื่อนเส้นขนานให้ชิดยอดแท่ง; เส้นล่างทึบ / เส้นบนประ"
        : trendChannel.trend === "down"
          ? "ขาลง: เชื่อม 2 พีว็อทสูงล่าสุดที่ต่ำลง (lower highs) แล้วเลื่อนเส้นขนานชิดก้นแท่ง; เส้นบนทึบ / เส้นล่างประ"
          : ""
      : "สำรอง: ฟิตเส้นถดถอย (OLS) แยกบนลำดับ high และ low — ได้ 2 เส้นที่ไม่ผ่านการบังคับให้ขนาน";

  return (
    <div className="space-y-0">
      <div
        ref={containerRef}
        className="h-[420px] w-full min-h-[320px] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40"
      />
      {rangeLevels && rangePctOfMid !== null ? (
        <p className="mt-2 px-1 text-[11px] leading-snug text-slate-500 md:text-xs">
          <span className="font-semibold text-slate-400">Trading range</span>{" "}
          ({rangeLevels.barsUsed} bars): Support{" "}
          <span className="font-mono text-emerald-400/90">
            {formatChartPrice(Math.max(refClose, 1e-12), rangeLevels.support)}
          </span>
          {" · "}Resistance{" "}
          <span className="font-mono text-red-300/90">
            {formatChartPrice(Math.max(refClose, 1e-12), rangeLevels.resistance)}
          </span>
          {" · "}Mid{" "}
          <span className="font-mono text-slate-400">
            {formatChartPrice(Math.max(refClose, 1e-12), rangeLevels.midpoint)}
          </span>
          <span className="text-slate-600">
            {" "}
            (band ~{rangePctOfMid}% vs. mid; dotted line = range midpoint).
          </span>
        </p>
      ) : null}
      {trendChannel &&
      upperTrendPct !== null &&
      lowerTrendPct !== null ? (
        <p className="mt-1 px-1 text-[11px] leading-snug text-slate-500 md:text-xs">
          <span className="font-semibold text-slate-400">Trend channel</span>{" "}
          ({trendChannel.barsUsed} bars ท้ายรอบสังเกต){". "}
          <span className="text-slate-600">{trendChannelBlurb}</span>
          {" "}
          <span className="text-amber-300/90">Upper</span>{" "}
          <span className="font-mono text-amber-200/80">
            {formatChartPrice(
              Math.max(refClose, 1e-12),
              trendChannel.upper.priceStart
            )}
          </span>
          {" → "}
          <span className="font-mono text-amber-200/80">
            {formatChartPrice(
              Math.max(refClose, 1e-12),
              trendChannel.upper.priceEnd
            )}
          </span>
          <span className="text-slate-600"> (~{upperTrendPct}%)</span>
          {" · "}
          <span className="text-teal-300/90">Lower</span>{" "}
          <span className="font-mono text-teal-200/80">
            {formatChartPrice(
              Math.max(refClose, 1e-12),
              trendChannel.lower.priceStart
            )}
          </span>
          {" → "}
          <span className="font-mono text-teal-200/80">
            {formatChartPrice(
              Math.max(refClose, 1e-12),
              trendChannel.lower.priceEnd
            )}
          </span>
          <span className="text-slate-600"> (~{lowerTrendPct}%)</span>
        </p>
      ) : null}
      {trendChannel?.lastBreak ? (
        <p className="mt-1 px-1 text-[11px] leading-snug md:text-xs">
          <span
            className={
              trendChannel.lastBreak.type === "breakout"
                ? "font-semibold text-amber-300"
                : "font-semibold text-rose-300"
            }
          >
            {trendChannel.lastBreak.type === "breakout"
              ? "⚠ Rule break: ราคาปิดทะลุเส้นบน"
              : "⚠ Rule break: ราคาปิดทะลุเส้นล่าง"}
          </span>{" "}
          <span className="text-slate-400">
            ปิดที่{" "}
            <span className="font-mono">
              {formatChartPrice(
                Math.max(refClose, 1e-12),
                trendChannel.lastBreak.closePrice
              )}
            </span>
            {" vs. เส้น "}
            <span className="font-mono">
              {formatChartPrice(
                Math.max(refClose, 1e-12),
                trendChannel.lastBreak.linePrice
              )}
            </span>
            {" — กฎกรอบเดิมถือว่าเสีย"}
          </span>
        </p>
      ) : null}
    </div>
  );
}
