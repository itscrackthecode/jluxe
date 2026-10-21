import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { CareersFooter, CareersHeader } from '@/components/careers/careers-site';
import { careersBasePath } from '@/lib/careers-navigation';

export const metadata: Metadata = {
  metadataBase: new URL('https://careers.thejluxe.com'),
  title: { default: 'Careers at JLUXE', template: '%s | JLUXE Careers' },
  description: 'Explore current opportunities and careers with JLUXE.',
  alternates: { canonical: 'https://careers.thejluxe.com/' },
};

export default async function CareersLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const host = (await headers()).get('host');
  const basePath = careersBasePath(host);
  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#103D33]">
      <CareersHeader basePath={basePath} />
      <main>{children}</main>
      <CareersFooter basePath={basePath} />
    </div>
  );
}
