import { StockMarketBrowser } from "@/components/StockMarketBrowser";

export const metadata = {
  title: "US markets · Stock Analyst",
};

export default function UsMarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">United States</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse the SEC company roster with Yahoo enrichment and open a chart.
        </p>
      </div>
      <StockMarketBrowser market="us" />
    </div>
  );
}
