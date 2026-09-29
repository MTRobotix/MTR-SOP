// Every page and API route requires a valid session, except the login page.
// Role checks happen in the pages/routes themselves (requireUser), against the DB.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "./lib/auth/token";

export async function proxy(request: NextRequest) {
  const claims = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (claims) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
