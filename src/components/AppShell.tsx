import { SidebarNav } from "@/components/SidebarNav";
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-emerald-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="flex flex-1 flex-col lg:flex-row">
        <SidebarNav />
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
