import { Suspense } from "react";
import { StockDetailClient } from "@/components/StockDetailClient";
import { StockDetailSkeleton } from "@/components/StockDetailSkeleton";
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
    <Suspense fallback={<StockDetailSkeleton />}>
      <StockDetailClient symbol={symbol} />
    </Suspense>
  );
}
