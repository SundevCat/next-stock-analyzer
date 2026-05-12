import { unstable_cache } from "next/cache";
import * as XLSX from "xlsx";
import { toTradingSymbol } from "@/lib/symbolCodec";
import type { StockSymbol } from "@/types/stock";
import { THAILAND_SECURITIES } from "@/data/thSecurities";

/** Official SET “listed companies” XLS (weekly). */
const SET_LISTED_XLS =
  "https://weblink.set.or.th/dat/eod/listedcompany/static/listedCompanies_en_US.xls";

const UA =
  "Mozilla/5.0 (compatible; StockAnalyzer/1.0; +https://github.com/; educational)";

type SetRow = Record<string, unknown>;

function symbolCell(row: SetRow): string {
  const v = row["List of Listed Companies & Contact Information"];
  return String(v ?? "").trim();
}

function companyCell(row: SetRow): string {
  return String(row["__EMPTY"] ?? "").trim();
}

function marketCell(row: SetRow): string {
  return String(row["__EMPTY_1"] ?? "").trim();
}

function normalizeMarket(m: string): string {
  return m.trim().toUpperCase();
}

async function fetchSetListedCompanies(): Promise<StockSymbol[]> {
  const res = await fetch(SET_LISTED_XLS, {
    headers: { "User-Agent": UA, Accept: "*/*" },
  });
  if (!res.ok) {
    throw new Error(`SET listed companies HTTP ${res.status}`);
  }
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<SetRow>(sheet, { defval: "" });

  const out: StockSymbol[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const rawSym = symbolCell(row);
    if (!rawSym || rawSym === "Symbol") continue;

    const mkt = normalizeMarket(marketCell(row));
    if (mkt && mkt !== "SET" && mkt !== "MAI") continue;

    const name = companyCell(row) || rawSym;
    const yahooSym = toTradingSymbol(`${rawSym.replace(/\s+/g, "")}.BK`);
    if (seen.has(yahooSym)) continue;
    seen.add(yahooSym);
    out.push({ symbol: yahooSym, name });
  }

  out.sort((a, b) =>
    a.symbol.localeCompare(b.symbol, undefined, { sensitivity: "base" })
  );
  return out;
}

const getCachedSetListed = unstable_cache(
  fetchSetListedCompanies,
  ["th-set-listed-companies-xls"],
  { revalidate: 86400 }
);

/** SET+mai roster from SET’s spreadsheet; falls back to static seed if fetch/parse fails. */
export async function getThailandSymbolUniverse(): Promise<StockSymbol[]> {
  try {
    return await getCachedSetListed();
  } catch {
    return THAILAND_SECURITIES;
  }
}
