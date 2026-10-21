export async function GET() {
  return new Response('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://careers.thejluxe.com/sitemap.xml\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
  });
}
