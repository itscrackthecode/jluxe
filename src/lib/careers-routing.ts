export function careersInternalRewrite(pathname: string): string | null {
  if (pathname === '/sitemap.xml') return '/careers/sitemap.xml';
  if (pathname === '/robots.txt') return '/careers/robots.txt';
  if (pathname === '/careers' || pathname.startsWith('/careers/')) return null;
  if (pathname.startsWith('/_next') || pathname.startsWith('/assets') || pathname.startsWith('/api') || pathname.includes('.')) return null;
  return pathname === '/' ? '/careers' : `/careers${pathname}`;
}

type CareersRoutingEnvironment = {
  VERCEL?: string;
  VERCEL_ENV?: string;
  VERCEL_URL?: string;
};

function normalizeHostname(host: string | null | undefined): string | null {
  return host?.toLowerCase().split(':')[0].replace(/\.$/, '') ?? null;
}

/** Preview routing is limited to the exact deployment URL Vercel assigns to
 * this project. The project slug and team suffix provide an additional guard
 * against accidentally enabling Careers on another Vercel project. */
export function isCareersPreviewHost(
  host: string | null | undefined,
  environment: CareersRoutingEnvironment = process.env as CareersRoutingEnvironment,
): boolean {
  const hostname = normalizeHostname(host);
  const deploymentHost = normalizeHostname(environment.VERCEL_URL);

  return Boolean(
    environment.VERCEL === '1' &&
      environment.VERCEL_ENV === 'preview' &&
      deploymentHost &&
      /^jluxe-[a-z0-9]+-winnishs-projects\.vercel\.app$/.test(deploymentHost) &&
      hostname === deploymentHost,
  );
}

/** Production Careers and the exact active Vercel Preview deployment get
 * clean-root rewrites. All other hosts retain their normal route behavior. */
export function careersHostRewrite(
  host: string | null | undefined,
  pathname: string,
  environment: CareersRoutingEnvironment = process.env as CareersRoutingEnvironment,
): string | null {
  const hostname = normalizeHostname(host);
  return hostname === 'careers.thejluxe.com' || isCareersPreviewHost(host, environment)
    ? careersInternalRewrite(pathname)
    : null;
}
