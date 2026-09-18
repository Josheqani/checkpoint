import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import {
  SESSION_COOKIE_NAME,
  getSessionSecret,
  verifySessionToken,
} from "./lib/session";

const intlMiddleware = createMiddleware(routing);

function getLocaleFromPathOrRequest(request: NextRequest): string {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length > 0 &&
    (routing.locales as readonly string[]).includes(segments[0])
  ) {
    return segments[0];
  }

  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (
    cookieLocale &&
    (routing.locales as readonly string[]).includes(cookieLocale)
  ) {
    return cookieLocale;
  }

  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.includes("fa")) {
    return "fa";
  }

  return routing.defaultLocale;
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Explicitly bypass auth API routes (e.g. /api/auth/login, /api/auth/logout)
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // 2. Explicitly bypass cron endpoint
  // NOTE: /api/check-reminders will need its own separate secret-based guard later, not the session cookie
  if (pathname === "/api/check-reminders") {
    return NextResponse.next();
  }

  // Check if target is a login page (/login, /en/login, /fa/login)
  const isLoginPage =
    pathname === "/login" ||
    routing.locales.some((loc) => pathname === `/${loc}/login`);

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const secret = getSessionSecret();
  const { valid } = await verifySessionToken(sessionCookie || "", secret);

  const locale = getLocaleFromPathOrRequest(request);

  if (isLoginPage) {
    if (valid) {
      // If already logged in, redirect to user's localized home
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    // Allow through to render the login page with locale handling
    return intlMiddleware(request);
  }

  // Protected routes: reject unauthenticated API requests with 401, redirect page requests to /{locale}/login
  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Authenticated API routes: proceed directly without intl redirect
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Authenticated page routes: proceed through intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static file extensions (.svg, .png, .jpg, .woff2, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$).*)",
  ],
};
