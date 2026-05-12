/** Subtle pulse block for loading placeholders (matches slate card surfaces). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-md bg-slate-800/85 ${className ?? ""}`}
    />
  );
}
