import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-12">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
          Next.js · Lightweight Charts · MongoDB favourites
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Scan the full US equity universe, chart prices, and see simple trend
          hints.
        </h1>
        <p className="mt-4 max-w-2xl text-slate-400">
          Search thousands of SEC-registered tickers, open interactive
          candlesticks with multiple timeframes, and mark names you track on a
          personal dashboard. Predictions are heuristic momentum signals — not
          a crystal ball.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/stocks/us"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow hover:bg-emerald-400"
          >
            US markets
          </Link>
          <Link
            href="/stocks/th"
            className="rounded-lg bg-emerald-600/90 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
          >
            Thailand markets
          </Link>
          <Link
            href="/dashboard/us"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            Favourites US
          </Link>
          <Link
            href="/dashboard/th"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
          >
            Favourites Thailand
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Full symbol universe",
            body: "Company roster sourced from the SEC, merged with live Yahoo search for discovery.",
          },
          {
            title: "Timeframes",
            body: "1m through weekly / monthly / quarterly candles with Yahoo-aligned ranges plus aggregated 4h bars.",
          },
          {
            title: "Favourites",
            body: "Star symbols and keep them in MongoDB (or in-memory when no URI is set).",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
          >
            <h2 className="text-sm font-semibold text-white">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{card.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
