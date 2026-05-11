import { cookies, headers } from "next/headers";
import { HEADER_SESSION, SESSION_COOKIE } from "@/lib/sessionConstants";

export { SESSION_COOKIE } from "@/lib/sessionConstants";

export async function getSessionId(): Promise<string> {
  const h = await headers();
  const fromHeader = h.get(HEADER_SESSION);
  if (fromHeader && fromHeader.length > 8) return fromHeader;

  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing && existing.length > 8) return existing;

  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
