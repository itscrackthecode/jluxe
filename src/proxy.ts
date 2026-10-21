import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { careersHostRewrite } from '@/lib/careers-routing';

/**
 * Hostname-based routing proxy (Next.js 16 "proxy.ts" convention).
 *
 * admin.thejluxe.com  -> serves the /admin subtree of the Next.js app.
 *                        "/" is rewritten to "/admin" (admin dashboard).
 *                        Clean sub-paths (e.g. /login) are rewritten to /admin/login.
 *                        Existing /admin and /admin/... routes pass through untouched.
 *
 * thejluxe.com / www  -> public website. GET/HEAD requests to /admin or /admin/...
 *                        are redirected (308) to admin.thejluxe.com.
 *                        Excludes /administrator, /admin-settings, etc.
 *                        POST requests, Server Actions, API routes, and public pages
 *                        are never redirected.
 *
 * Everything else     -> passed through unchanged.
 * careers.thejluxe.com -> serves the /careers route tree at the subdomain root.
 */
export function proxy(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';
  // Strip port so local dev (e.g. host:3000) matches the same hostname logic.
  const hostname = host.split(':')[0];

  // Precise admin path check: matches "/admin" or "/admin/..."
  // Does NOT match "/administrator", "/admin-settings", etc.
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');

  if (hostname === 'careers.thejluxe.com') {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      if (request.method === 'GET' || request.method === 'HEAD') {
        const destination = new URL('/careers', 'https://admin.thejluxe.com');
        destination.search = request.nextUrl.search;
        return NextResponse.redirect(destination, { status: 308 });
      }
      return NextResponse.next();
    }
    const destination = careersHostRewrite(hostname, pathname);
    return destination ? NextResponse.rewrite(new URL(destination, request.url)) : NextResponse.next();
  }

  // ---- Admin subdomain (admin.thejluxe.com) --------------------------------
  if (hostname === 'admin.thejluxe.com') {
    // 1. Pass through Next.js internals, public API routes, and static assets unchanged
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/assets') ||
      pathname.includes('.')
    ) {
      return NextResponse.next();
    }

    // 2. Pass through already-prefixed admin paths (/admin, /admin/...)
    // This includes /admin/api/..., /admin/login, /admin/properties, etc.
    // Also ensures Server Action POSTs targeting /admin/... are never rewritten.
    if (isAdminPath) {
      return NextResponse.next();
    }

    // 3. Root "/" rewrites to the admin dashboard (/admin)
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', request.url));
    }

    // 4. Clean admin deep-links (e.g. /login -> /admin/login)
    return NextResponse.rewrite(new URL('/admin' + pathname, request.url));
  }

  // ---- Public hostnames (thejluxe.com, www.thejluxe.com) -------------------
  const isPublicDomain =
    hostname === 'thejluxe.com' || hostname === 'www.thejluxe.com';

  // Only redirect GET and HEAD browser navigations to /admin or /admin/...
  // Do NOT redirect POST requests, Server Actions, API routes, or non-admin paths.
  if (isPublicDomain && isAdminPath && !pathname.startsWith('/admin/api')) {
    if (request.method === 'GET' || request.method === 'HEAD') {
      const destination = new URL(pathname, 'https://admin.thejluxe.com');
      destination.search = request.nextUrl.search;
      return NextResponse.redirect(destination, { status: 308 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next.js internals, static assets, image optimisation,
     * and common metadata files.
     */
    '/((?!_next/|assets/|favicon\\.ico|.*\\.(?:png|svg|jpg|jpeg|webp|avif|ico|webmanifest)$).*)',
  ],
};
