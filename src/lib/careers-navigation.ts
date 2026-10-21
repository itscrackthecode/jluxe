export function careersBasePath(hostname: string | null | undefined) {
  return hostname?.toLowerCase().split(':')[0] === 'careers.thejluxe.com' ? '' : '/careers';
}

export function careersHref(basePath: string, path = '/') {
  if (path === '/') return basePath || '/';
  return `${basePath}${path.startsWith('/') ? path : `/${path}`}`;
}
