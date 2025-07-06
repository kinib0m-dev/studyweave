import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "@/lib/auth/routes/routes";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

function addSecurityHeaders(response: NextResponse) {
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  );

  // X-Frame-Options
  response.headers.set("X-Frame-Options", "DENY");

  // X-Content-Type-Options
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // X-XSS-Protection
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=(), fullscreen=(self)"
  );

  if (process.env.NODE_ENV === "production") {
    // Strict Transport Security (HTTPS only)
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // Create response
  let response = NextResponse.next();

  // Skip middleware for API auth routes, tRPC routes, and webhooks
  if (isApiAuthRoute) {
    return addSecurityHeaders(response);
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      response = NextResponse.redirect(
        new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)
      );
    }
    return addSecurityHeaders(response);
  }

  if (!isLoggedIn && !isPublicRoute) {
    response = NextResponse.redirect(new URL("/login", nextUrl));
    return addSecurityHeaders(response);
  }

  return addSecurityHeaders(response);
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
