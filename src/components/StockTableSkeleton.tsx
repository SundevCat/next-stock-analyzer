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
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">
              Suggestion
            </th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium text-right">{lastHeading}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {Array.from({ length: rows }, (_, i) => (
            <tr key={i} className="bg-slate-950/40">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Skeleton className="h-6 w-[4.5rem] rounded-full" />
              </td>
              <td className="max-w-xs px-4 py-3 sm:max-w-md">
                <Skeleton className="h-4 w-[min(100%,14rem)]" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-14" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-7 w-20 rounded-lg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
