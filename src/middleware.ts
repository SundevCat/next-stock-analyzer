import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { HEADER_SESSION, SESSION_COOKIE } from "@/lib/sessionConstants";

export function middleware(request: NextRequest) {
  let sid = request.cookies.get(SESSION_COOKIE)?.value;
  const created = !sid;
  if (!sid) {
    sid = crypto.randomUUID();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(HEADER_SESSION, sid);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (created) {
    response.cookies.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
