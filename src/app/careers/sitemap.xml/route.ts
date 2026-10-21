import { listPublicCareerJobs } from '@/lib/db/queries/careers';

export const dynamic = 'force-dynamic';

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export async function GET() {
  try {
    const jobs = await listPublicCareerJobs();
    const urls = [
      'https://careers.thejluxe.com/',
      ...jobs.map((job) => `https://careers.thejluxe.com/jobs/${encodeURIComponent(job.slug)}`),
    ];
    const entries = urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`).join('');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://careers.thejluxe.com/</loc></url></urlset>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
}
