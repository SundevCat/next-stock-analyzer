import { StockMarketBrowser } from "@/components/StockMarketBrowser";

export const metadata = {
  title: "Thailand markets · Stock Analyst",
};

export default function ThailandMarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thailand</h1>
        <p className="mt-1 text-sm text-slate-400">
          SET-focused roster (Yahoo <code className="font-mono text-slate-400">.BK</code>{" "}
          symbols); search also surfaces other Thai tickers and funds.
        </p>
      </div>
      <StockMarketBrowser market="th" />
    </div>
  );
}
