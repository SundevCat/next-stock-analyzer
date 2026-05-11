import { StockMarketBrowser } from "@/components/StockMarketBrowser";

export const metadata = {
  title: "Markets · Stock Analyst",
};

export default function StocksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">US equities</h1>
        <p className="mt-1 text-sm text-slate-400">
          Search the SEC&apos;s company roster (with Yahoo enrichment) and open
          an interactive chart.
        </p>
      </div>
      <StockMarketBrowser />
    </div>
  );
}
