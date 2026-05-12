import { Skeleton } from "@/components/ui/Skeleton";

type Props = { label?: string };

/**
 * Mirrors the stock detail layout: chart area (~420px) + two-column insight panel.
 */
export function StockDetailSkeleton({
  label = "Loading chart and analysis",
}: Props) {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>

      <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 sm:p-4">
        <div className="flex items-end justify-between gap-2 border-b border-slate-800/80 pb-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="mt-3 h-[420px] w-full rounded-lg" />
      </div>

      <section
        className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-5 sm:grid-cols-2"
        aria-hidden
      >
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-full max-w-sm" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[95%]" />
            <Skeleton className="h-3 w-[80%]" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-full" />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
