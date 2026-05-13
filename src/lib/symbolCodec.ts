/**
 * Normalize tickers from URL paths, query strings, and upstream APIs.
 * Display form strips Yahoo's leading caret (^) and URL-encoded "%5E".
 */

export function decodeTickerFromUrl(raw: string): string {
  let s = raw.trim();
  if (!s) return s;
  for (let i = 0; i < 5; i++) {
    try {
      const next = decodeURIComponent(s.replace(/\+/g, " "));
      if (next === s) break;
      s = next.trim();
    } catch {
      break;
    }
  }
  return s;
}

/** Strip accidental literal "%5E" prefix when not valid percent-encoding. */
function repairLegacyCaretEncoding(s: string): string {
  let out = s;
  while (out.startsWith("%5E") || out.startsWith("%5e")) {
    out = "^" + out.slice(3);
  }
  return out;
}

/**
 * Symbol used for Yahoo chart/search and internal keys (SEC-style dash, caret for indices).
 */
export function toTradingSymbol(raw: string): string {
  let s = repairLegacyCaretEncoding(decodeTickerFromUrl(raw));
  s = s.trim().replace(/\uFEFF/g, "");
  return s.toUpperCase();
}

/**
 * Human-readable ticker for UI and public JSON `symbol` fields.
 * Drops Yahoo index caret (^), trims `.BK`, and hides Yahoo suffix segments
 * after the first "=" (e.g. XAUUSD=X → XAUUSD, GC=F → GC).
 */
export function toDisplaySymbol(raw: string): string {
  const t = toTradingSymbol(raw);
  let display = t.startsWith("^") ? t.slice(1) : t;
  const eq = display.indexOf("=");
  if (eq !== -1) {
    display = display.slice(0, eq);
  }
  if (display.endsWith(".BK")) {
    display = display.slice(0, -3);
  }
  return display;
}
