import type { Metadata, Viewport } from 'next';
import { siteConfig } from '@/lib/data';
import './globals.css';

const siteDescription =
  'JLUXE connects opportunities across real estate, business solutions, talent and training, interiors and design.';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'JLUXE — Building Possibilities',
    template: '%s | JLUXE',
  },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName: siteConfig.brand,
    title: 'JLUXE — Building Possibilities',
    description: siteDescription,
    url: '/',
    images: [{ url: '/assets/images/jluxe-logo.png', width: 1536, height: 1024, alt: siteConfig.brand }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JLUXE — Building Possibilities',
    description: siteDescription,
    images: ['/assets/images/jluxe-logo.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
