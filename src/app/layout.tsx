import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JLUXE — Building Possibilities',
  description: 'JLUXE connects opportunities across real estate, business solutions, talent and training, interiors and design.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
