import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

const protectedRoutes = [
  "/dashboard",
  "/settings",
  "/profile",
  "/new-post",
  "/edit-post",
  "/new",
  "/edit",
  "/preview",
];

const authRoutes = ["/login", "/register"];

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
  alternateLinks: false,
});

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle internationalization first
  const intlResponse = intlMiddleware(request);

  // If intl middleware wants to redirect, let it
  if (intlResponse && intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // Extract locale from pathname for auth checks
  const segments = pathname.split("/");
  const maybeLocale = segments[1];
  const isLocaleInPath = locales.includes(maybeLocale as any);

  // Get the actual pathname without locale prefix
  const actualPathname = isLocaleInPath
    ? "/" + segments.slice(2).join("/")
    : pathname;

  // Get current locale - prioritize URL locale over default
  const currentLocale = isLocaleInPath ? maybeLocale : defaultLocale;

  const token = await getToken({
    req: request,
    secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  });

  if (actualPathname === "/auth") {
    if (token) {
      const dashboardUrl = new URL(
        `/${currentLocale}/dashboard`,
        request.nextUrl.origin
      );
      return NextResponse.redirect(dashboardUrl.toString());
    } else {
      const loginUrl = new URL(
        `/${currentLocale}/login`,
        request.nextUrl.origin
      );
      return NextResponse.redirect(loginUrl.toString());
    }
  }

  if (actualPathname === "/users" || actualPathname === "/user") {
    if (token) {
      const userProfileUrl = new URL(
        `/${currentLocale}/users/${token.sub}`,
        request.nextUrl.origin
      );
      return NextResponse.redirect(userProfileUrl.toString());
    } else {
      const loginUrl = new URL(
        `/${currentLocale}/login`,
        request.nextUrl.origin
      );
      return NextResponse.redirect(loginUrl.toString());
    }
  }

  if (
    actualPathname === "/blog" ||
    actualPathname === "/blogs" ||
    actualPathname === "/api" ||
    actualPathname === "/category"
  ) {
    const homeUrl = new URL(`/${currentLocale}`, request.nextUrl.origin);
    return NextResponse.redirect(homeUrl.toString());
  }

  const isProtectedRoute =
    protectedRoutes.some((route) => actualPathname.startsWith(route)) ||
    actualPathname.startsWith("/edit-post/");

  const isAuthRoute = authRoutes.some((route) => actualPathname === route);

  if (isProtectedRoute && !token) {
    const absoluteUrl = new URL(
      `/${currentLocale}/login`,
      request.nextUrl.origin
    );
    return NextResponse.redirect(absoluteUrl.toString());
  }

  if (isAuthRoute && token) {
    const absoluteUrl = new URL(
      `/${currentLocale}/dashboard`,
      request.nextUrl.origin
    );
    return NextResponse.redirect(absoluteUrl.toString());
  }

  // Always return the intl response to maintain locale handling
  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    "/",
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    "/(es|en)/:path*",
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
