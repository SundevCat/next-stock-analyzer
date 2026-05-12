import { Activity, Bookmark, LineChart } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  /** Table body placeholder rows */
  rows?: number;
  lastColumn: "favourite" | "chart";
  /** Accessible status label for screen readers */
  label?: string;
};

export function StockTableSkeleton({
  rows = 8,
  lastColumn,
  label = "Loading table",
}: Props) {
  const lastHeading = lastColumn === "favourite" ? "Favourite" : "Chart";

  return (
    <div
      className="overflow-x-auto rounded-xl border border-slate-800"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <table className="w-full min-w-0 text-left text-xs md:min-w-[36rem] md:text-sm">
        <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wide text-slate-500 md:text-xs">
          <tr>
            <th className="px-2 py-2 font-medium md:px-4 md:py-3">
              Symbol
            </th>
            <th className="w-12 px-1 py-2 text-center font-medium md:w-auto md:px-4 md:text-left">
              <Activity
                className="mx-auto h-4 w-4 text-slate-600 md:hidden"
                aria-hidden
              />
              <span className="sr-only md:hidden">Suggestion</span>
              <span className="hidden md:inline">Suggestion</span>
            </th>
            <th className="hidden font-medium md:table-cell md:px-4 md:py-3">
              Name
            </th>
            <th className="px-2 py-2 text-right font-medium md:px-4 md:py-3">
              Price
            </th>
            <th className="px-2 py-2 text-right font-medium md:px-4 md:py-3">
              <div className="flex justify-end md:block">
                {lastColumn === "favourite" ? (
                  <Bookmark
                    className="h-4 w-4 text-slate-600 md:hidden"
                    aria-hidden
                  />
                ) : (
                  <LineChart
                    className="h-4 w-4 text-slate-600 md:hidden"
                    aria-hidden
                  />
                )}
                <span className="sr-only md:hidden">{lastHeading}</span>
                <span className="hidden md:inline">{lastHeading}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} className="bg-slate-950/40">
              <td className="px-2 py-2.5 md:px-4 md:py-3">
                <Skeleton className="h-3.5 w-14 md:h-4 md:w-16" />
              </td>
              <td className="px-1 py-2.5 text-center md:px-4 md:py-3">
                <Skeleton className="mx-auto size-8 rounded-full md:h-6 md:w-[4.5rem] md:rounded-full" />
              </td>
              <td className="hidden px-4 py-2.5 md:table-cell md:py-3">
                <Skeleton className="h-4 w-[min(100%,14rem)]" />
              </td>
              <td className="px-2 py-2.5 text-right md:px-4 md:py-3">
                <Skeleton className="ml-auto h-3 w-12 md:h-4 md:w-14" />
              </td>
              <td className="px-2 py-2.5 text-right md:px-4 md:py-3">
                <Skeleton className="ml-auto h-8 w-10 rounded-lg md:h-7 md:w-20" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
