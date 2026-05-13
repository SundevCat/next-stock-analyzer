import { StockMarketBrowser } from "@/components/StockMarketBrowser";

export const metadata = {
  title: "Indices · FX · funds · commodities · Stock Analyst",
};

export default function ExtrasMarketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Indices, FX &amp; commodities
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Yahoo whitelist: benchmark indices (^GSPC = US S&amp;P 500 — same role
          as INDEXSP:.INX / INX on other portals), spot FX including{" "}
          <code className="rounded bg-slate-800/90 px-1 py-px text-slate-200">
            XAUUSD=X
          </code>{" "}
          for XAU/USD, plus futures &amp; ETF gold, sample ETFs, Thai gold &amp;
          SET index. Search stays on this list.
        </p>
      </div>
      <StockMarketBrowser market="extras" />
    </div>
  );
}
