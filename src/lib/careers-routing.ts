export function careersInternalRewrite(pathname: string): string | null {
  if (pathname === '/sitemap.xml') return '/careers/sitemap.xml';
  if (pathname === '/robots.txt') return '/careers/robots.txt';
  if (pathname === '/careers' || pathname.startsWith('/careers/')) return null;
  if (pathname.startsWith('/_next') || pathname.startsWith('/assets') || pathname.startsWith('/api') || pathname.includes('.')) return null;
  return pathname === '/' ? '/careers' : `/careers${pathname}`;
}

/** Only the Careers hostname gets clean-root rewrites. All other hosts retain
 * their normal route behavior, including localhost's direct /careers routes. */
export function careersHostRewrite(host: string | null | undefined, pathname: string): string | null {
  const hostname = host?.toLowerCase().split(':')[0];
  return hostname === 'careers.thejluxe.com' ? careersInternalRewrite(pathname) : null;
}
