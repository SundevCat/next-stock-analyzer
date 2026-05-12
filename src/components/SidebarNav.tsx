"use client";

import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Home,
  LayoutGrid,
  MapPin,
  Star,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useMemo } from "react";
import type { MarketId } from "@/lib/marketKind";
import { marketOfSymbol } from "@/lib/marketKind";

export type SidebarNavVariant = "full" | "rail";

export type SidebarNavProps = {
  variant?: SidebarNavVariant;
  /** After any nav link (e.g. close mobile drawer). */
  onNavigate?: () => void;
  /** Hide duplicate brand block (drawer supplies its own header). */
  mobileDrawer?: boolean;
  /** Desktop only: toggle between full and rail. */
  onToggleCollapse?: () => void;
  desktopCollapsed?: boolean;
};

function navRowClass(active: boolean, rail: boolean) {
  return [
    "group flex items-center rounded-lg transition",
    rail
      ? "min-h-11 w-full justify-center px-2 py-2.5"
      : "gap-3 px-3 py-2.5",
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
  rail,
  tone = "muted",
}: {
  icon: LucideIcon;
  children: ReactNode;
  rail: boolean;
  /** Amber accent for favourites / saved lists (matches star actions). */
  tone?: "muted" | "amber";
}) {
  if (rail) {
    return (
      <div className="mx-2 my-2 h-px bg-slate-800/90" aria-hidden />
    );
  }
  const iconClass =
    tone === "amber" ? "text-amber-500/85" : "text-slate-500";
  return (
    <div className="mb-2 mt-1 flex items-center gap-2 px-1">
      <Icon className={`h-3.5 w-3.5 ${iconClass}`} strokeWidth={2} aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {children}
      </span>
    </div>
  );
}

export function SidebarNav({
  variant = "full",
  onNavigate,
  mobileDrawer = false,
  onToggleCollapse,
  desktopCollapsed = false,
}: SidebarNavProps) {
  const rail = variant === "rail";
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

  const NavLink = ({
    href,
    active,
    className,
    title,
    children,
  }: {
    href: string;
    active: boolean;
    className: string;
    title: string;
    children: ReactNode;
  }) => (
    <Link
      href={href}
      className={className}
      title={title}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      {children}
    </Link>
  );

  return (
    <aside className="flex h-full min-h-0 flex-col">
      {!mobileDrawer ? (
        <div
          className={[
            "border-b border-slate-800",
            rail ? "flex justify-center px-2 py-3" : "px-4 py-4 lg:px-3",
          ].join(" ")}
        >
          <Link
            href="/"
            title="Stock Analyst — Home"
            className={
              rail
                ? "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-emerald-500/90 transition hover:bg-slate-900 hover:text-emerald-400"
                : "group flex items-center gap-2 text-lg font-semibold tracking-tight text-white hover:text-emerald-300"
            }
          >
            <LayoutGrid className="h-5 w-5 shrink-0" aria-hidden />
            {!rail ? <span>Stock Analyst</span> : null}
            {rail ? (
              <span className="sr-only">Stock Analyst — Home</span>
            ) : null}
          </Link>
        </div>
      ) : null}

      <nav className="flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto p-3 pb-2">
        <NavLink
          href="/"
          active={pathname === "/"}
          className={navRowClass(pathname === "/", rail)}
          title="Home"
        >
          <Home className={navIconClass(pathname === "/")} aria-hidden />
          {!rail ? <span>Home</span> : null}
          {rail ? <span className="sr-only">Home</span> : null}
        </NavLink>

        <div
          className="my-3 h-px bg-gradient-to-r from-transparent via-slate-700/90 to-transparent"
          aria-hidden
        />

        <SectionLabel icon={Globe2} rail={rail}>
          Markets
        </SectionLabel>
        <div
          className={
            rail
              ? "space-y-1"
              : "space-y-0.5 rounded-xl border border-slate-800/80 bg-slate-900/35 p-1.5"
          }
        >
          <NavLink
            href="/stocks/us"
            active={is("/stocks/us") || detailMarket === "us"}
            className={navRowClass(
              is("/stocks/us") || detailMarket === "us",
              rail
            )}
            title="United States — SEC list and search"
          >
            <Globe2
              className={navIconClass(
                is("/stocks/us") || detailMarket === "us"
              )}
              aria-hidden
            />
            {!rail ? (
              <span className="flex min-w-0 flex-col">
                <span>United States</span>
                <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                  SEC list &amp; search
                </span>
              </span>
            ) : (
              <span className="sr-only">
                United States markets, SEC list and search
              </span>
            )}
          </NavLink>
          <NavLink
            href="/stocks/th"
            active={is("/stocks/th") || detailMarket === "th"}
            className={navRowClass(
              is("/stocks/th") || detailMarket === "th",
              rail
            )}
            title="Thailand — SET / mai (Yahoo)"
          >
            <MapPin
              className={navIconClass(
                is("/stocks/th") || detailMarket === "th"
              )}
              aria-hidden
            />
            {!rail ? (
              <span className="flex min-w-0 flex-col">
                <span>Thailand</span>
                <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                  SET / mai (Yahoo)
                </span>
              </span>
            ) : (
              <span className="sr-only">
                Thailand markets, SET and mai on Yahoo
              </span>
            )}
          </NavLink>
        </div>

        <div
          className="my-3 h-px bg-gradient-to-r from-transparent via-slate-700/90 to-transparent"
          aria-hidden
        />

        <SectionLabel icon={Star} rail={rail} tone="amber">
          Favourites
        </SectionLabel>
        <div
          className={
            rail
              ? "space-y-1"
              : "space-y-0.5 rounded-xl border border-slate-800/80 bg-slate-900/35 p-1.5"
          }
        >
          <NavLink
            href="/dashboard/us"
            active={is("/dashboard/us")}
            className={navRowClass(is("/dashboard/us"), rail)}
            title="Favourites — United States"
          >
            <Star
              className={navIconClass(is("/dashboard/us"))}
              aria-hidden
            />
            {!rail ? (
              <span className="flex min-w-0 flex-col">
                <span>United States</span>
                <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                  Saved US tickers
                </span>
              </span>
            ) : (
              <span className="sr-only">
                United States favourites, saved tickers
              </span>
            )}
          </NavLink>
          <NavLink
            href="/dashboard/th"
            active={is("/dashboard/th")}
            className={navRowClass(is("/dashboard/th"), rail)}
            title="Favourites — Thailand"
          >
            <Star
              className={navIconClass(is("/dashboard/th"))}
              aria-hidden
            />
            {!rail ? (
              <span className="flex min-w-0 flex-col">
                <span>Thailand</span>
                <span className="truncate text-[11px] font-normal text-slate-500 group-hover:text-slate-400">
                  Saved TH tickers
                </span>
              </span>
            ) : (
              <span className="sr-only">Thailand favourites, saved tickers</span>
            )}
          </NavLink>
        </div>
      </nav>

      {onToggleCollapse ? (
        <div className="mt-auto hidden border-t border-slate-800 p-2 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-2 text-xs font-medium text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
            aria-label={
              desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            aria-expanded={!desktopCollapsed}
          >
            {desktopCollapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      ) : null}
    </aside>
  );
}
