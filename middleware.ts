import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./app/lib/session";

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chronimy podstrony wymagające konta.
  const protectedRoute =
    pathname.startsWith("/subskrypcja") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/dashboard"); // zachowana kompatybilność (redirect)
  if (!protectedRoute) return NextResponse.next();

  const token = request.cookies.get("submanager_session")?.value;
  const secret = process.env.SUBMANAGER_SECRET || "dev-secret-change-me";

  const username = token ? await verifySessionToken(token, secret) : null;

  if (!username) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/subskrypcja/:path*", "/chat/:path*", "/profile/:path*", "/dashboard/:path*"],
};
