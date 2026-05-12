"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SidebarNav } from "@/components/SidebarNav";

const STORAGE_KEY = "stock-analyzer-sidebar-collapsed";

export function AppShellClient({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setDesktopCollapsed(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, desktopCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [desktopCollapsed, hydrated]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const t = window.setTimeout(() => closeButtonRef.current?.focus(), 10);
    return () => window.clearTimeout(t);
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  const prevMobileOpen = useRef(false);
  useEffect(() => {
    if (prevMobileOpen.current && !mobileOpen) {
      menuButtonRef.current?.focus();
    }
    prevMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggleDesktop = useCallback(() => {
    setDesktopCollapsed((v) => !v);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-emerald-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-800 bg-slate-950/90 px-3 py-2.5 backdrop-blur-md lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          id="mobile-menu-button"
          aria-expanded={mobileOpen}
          aria-controls="site-navigation"
          onClick={() => setMobileOpen(true)}
          className="inline-flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
          <span className="sr-only">Open navigation menu</span>
        </button>
        <Link
          href="/"
          className="min-h-11 flex flex-1 items-center truncate text-base font-semibold tracking-tight text-white"
        >
          Stock Analyst
        </Link>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <aside
            id="site-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute left-0 top-0 flex h-full w-[min(20rem,88vw)] max-w-full flex-col border-r border-slate-800 bg-slate-950 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-3">
              <p id={titleId} className="sr-only">
                Main navigation
              </p>
              <Link
                href="/"
                className="min-h-10 min-w-0 flex-1 text-lg font-semibold text-white"
                onClick={closeMobile}
              >
                Stock Analyst
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobile}
                className="inline-flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <SidebarNav
                variant="full"
                onNavigate={closeMobile}
                mobileDrawer
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col lg:flex-row">
        <div
          className={[
            "hidden flex-shrink-0 flex-col border-slate-800 bg-slate-950/95 backdrop-blur-sm transition-[width] duration-200 ease-out lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-h-screen",
            desktopCollapsed ? "w-[76px] border-r" : "w-60 border-r",
          ].join(" ")}
        >
          <SidebarNav
            variant={desktopCollapsed ? "rail" : "full"}
            onToggleCollapse={toggleDesktop}
            desktopCollapsed={desktopCollapsed}
          />
        </div>

        <div
          id="main-content"
          className="flex min-w-0 flex-1 flex-col"
          tabIndex={-1}
        >
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
            {children}
          </main>
        </div>
      </div>

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Educational demo — not investment advice. Data from Yahoo Finance &amp;
        SEC.
      </footer>
    </div>
  );
}
