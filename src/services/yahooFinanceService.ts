import type { Candle, TimeframeId } from "@/types/stock";
import { yahooChartParams } from "@/lib/timeframes";
import { toTradingSymbol } from "@/lib/symbolCodec";

const YAHOO_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

type YahooChartResult = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
        }>;
      };
      meta?: { currency?: string; symbol?: string };
    }>;
    error?: { description?: string };
  };
};

function toCandles(result: NonNullable<YahooChartResult["chart"]>["result"]): Candle[] {
  const first = result?.[0];
  const ts = first?.timestamp ?? [];
  const q = first?.indicators?.quote?.[0];
  if (!q || !ts.length) return [];

  const out: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    if (
      o == null ||
      h == null ||
      l == null ||
      c == null ||
      Number.isNaN(o) ||
      Number.isNaN(c)
    ) {
      continue;
    }
    out.push({
      time: ts[i]!,
      open: o,
      high: h,
      low: l,
      close: c,
    });
  }
  return out;
}

function aggregateTo4h(hourly: Candle[]): Candle[] {
  const BUCKET = 4 * 60 * 60;
  const buckets = new Map<
    number,
    { open: number; high: number; low: number; close: number; t: number }
  >();
  for (const c of hourly) {
    const bucketStart = Math.floor(c.time / BUCKET) * BUCKET;
    const prev = buckets.get(bucketStart);
    if (!prev) {
      buckets.set(bucketStart, {
        t: bucketStart,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      });
    } else {
      prev.high = Math.max(prev.high, c.high);
      prev.low = Math.min(prev.low, c.low);
      prev.close = c.close;
    }
  }
  return [...buckets.values()]
    .sort((a, b) => a.t - b.t)
    .map((b) => ({
      time: b.t,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
}

export async function fetchYahooCandles(
  symbol: string,
  timeframe: TimeframeId
): Promise<Candle[]> {
  const sym = toTradingSymbol(symbol);

  if (timeframe === "4h") {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1h&range=2y`;
    const res = await fetch(url, {
      headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Yahoo chart error ${res.status}`);
    const body = (await res.json()) as YahooChartResult;
    const err = body.chart?.error;
    if (err) throw new Error(err.description ?? "Yahoo chart error");
    const raw = toCandles(body.chart?.result ?? []);
    return aggregateTo4h(raw);
  }

  const { interval, range } = yahooChartParams(timeframe);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
    next: {
      revalidate:
        timeframe === "1m"
          ? 30
          : timeframe === "1mo" || timeframe === "3mo"
            ? 3600
            : 120,
    },
  });
  if (!res.ok) throw new Error(`Yahoo chart error ${res.status}`);
  const body = (await res.json()) as YahooChartResult;
  const err = body.chart?.error;
  if (err) throw new Error(err.description ?? "Yahoo chart error");
  return toCandles(body.chart?.result ?? []);
}

export async function yahooSearchSymbols(
  query: string
): Promise<{ symbol: string; name: string }[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`;
  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    quotes?: Array<{ symbol?: string; shortname?: string; longname?: string }>;
  };
  const out: { symbol: string; name: string }[] = [];
  for (const row of data.quotes ?? []) {
    if (!row.symbol) continue;
    out.push({
      symbol: toTradingSymbol(row.symbol),
      name: row.longname ?? row.shortname ?? row.symbol,
    });
  }
  return out;
}
