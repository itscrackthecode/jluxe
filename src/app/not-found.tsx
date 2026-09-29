import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />
      <section className="flex flex-1 items-center py-20 sm:py-24">
        <div className="container-xl">
          <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">JLUXE</p>
          <h1 className="mt-5 font-display text-5xl leading-tight sm:text-6xl">Page not found</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            The page you&apos;re looking for doesn&apos;t exist or may have moved.
          </p>
          <Link href="/" className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--viridian-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">
            Back to JLUXE <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
