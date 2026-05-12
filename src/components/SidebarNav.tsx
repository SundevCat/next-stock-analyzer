"use client";

import {
  Bookmark,
  Globe2,
  Home,
  LayoutGrid,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import type { MarketId } from "@/lib/marketKind";
import { marketOfSymbol } from "@/lib/marketKind";

function navRowClass(active: boolean) {
  return [
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
    active
      ? "bg-slate-800 font-medium text-white shadow-sm ring-1 ring-white/5"
      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
  ].join(" ");
}

function navIconClass(active: boolean) {
  return [
    "h-[18px] w-[18px] flex-shrink-0 transition-colors",
    active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300",
  ].join(" ");
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="mb-2 mt-1 flex items-center gap-2 px-1">
      <Icon
        className="h-3.5 w-3.5 text-slate-500"
        strokeWidth={2}
        aria-hidden
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {children}
      </span>
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  const detailMarket: MarketId | null = useMemo(() => {
    const m = pathname.match(/^\/stocks\/([^/]+)$/);
    if (!m) return null;
    const seg = decodeURIComponent(m[1]);
    if (seg === "us" || seg === "th") return null;
    return marketOfSymbol(seg);
  }, [pathname]);

  const is = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  return (
    <aside className="flex w-full flex-shrink-0 flex-col border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm lg:w-60 lg:border-b-0 lg:border-r">
      <div className="border-b border-slate-800 px-4 py-4 lg:px-3">
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-semibold tracking-tight text-white hover:text-emerald-300"
        >
          <LayoutGrid
            className="h-5 w-5 text-emerald-500/90 transition group-hover:text-emerald-400"
            aria-hidden
          />
          <span>Stock Analyst</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0 p-3 pb-6">
        <Link
          href="/"
          className={`group ${navRowClass(pathname === "/")}`}
        >
          <Home className={navIconClass(pathname === "/")} aria-hidden />
          <span>Home</span>
        </Link>

        <div
          className="my-3 h-px bg-gradient-to-r from-transparent via-slate-700/90 to-transparent"
          aria-hidden
        />

        <SectionLabel icon={Globe2}>Markets</SectionLabel>
        <div className="space-y-0.5 rounded-xl border border-slate-800/80 bg-slate-900/35 p-1.5">
          <Link
            href="/stocks/us"
            className={`group ${navRowClass(
              is("/stocks/us") || detailMarket === "us"
            )}`}
          >
            <Globe2
              className={navIconClass(
                is("/stocks/us") || detailMarket === "us"
              )}
              aria-hidden
            />
            <span className="flex min-w-0 flex-col">
              <span>United States</span>
              <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                SEC list &amp; search
              </span>
            </span>
          </Link>
          <Link
            href="/stocks/th"
            className={`group ${navRowClass(
              is("/stocks/th") || detailMarket === "th"
            )}`}
          >
            <MapPin
              className={navIconClass(
                is("/stocks/th") || detailMarket === "th"
              )}
              aria-hidden
            />
            <span className="flex min-w-0 flex-col">
              <span>Thailand</span>
              <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                SET / mai (Yahoo)
              </span>
            </span>
          </Link>
        </div>

        <div
          className="my-3 h-px bg-gradient-to-r from-transparent via-slate-700/90 to-transparent"
          aria-hidden
        />

        <SectionLabel icon={Bookmark}>Favourites</SectionLabel>
        <div className="space-y-0.5 rounded-xl border border-slate-800/80 bg-slate-900/35 p-1.5">
          <Link
            href="/dashboard/us"
            className={`group ${navRowClass(is("/dashboard/us"))}`}
          >
            <Bookmark
              className={navIconClass(is("/dashboard/us"))}
              aria-hidden
            />
            <span className="flex min-w-0 flex-col">
              <span>United States</span>
              <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                Saved US tickers
              </span>
            </span>
          </Link>
          <Link
            href="/dashboard/th"
            className={`group ${navRowClass(is("/dashboard/th"))}`}
          >
            <Bookmark
              className={navIconClass(is("/dashboard/th"))}
              aria-hidden
            />
            <span className="flex min-w-0 flex-col">
              <span>Thailand</span>
              <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                Saved TH tickers
              </span>
            </span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
