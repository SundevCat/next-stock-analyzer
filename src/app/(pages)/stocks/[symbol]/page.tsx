import { Suspense } from "react";
import { StockDetailClient } from "@/components/StockDetailClient";
import { toDisplaySymbol } from "@/lib/symbolCodec";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return {
    title: `${toDisplaySymbol(symbol)} · Stock Analyst`,
  };
}

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-500">Loading chart…</div>
      }
    >
      <StockDetailClient symbol={symbol} />
    </Suspense>
  );
}
