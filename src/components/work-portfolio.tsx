'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { siteConfig, workItems, type WorkCategory } from '@/lib/data';

const categoryOrder: WorkCategory[] = [
  'Real Estate',
  'Business Solutions',
  'Talent & Training',
  'Interiors & Design',
];

export default function WorkPortfolio() {
  const [activeCategory, setActiveCategory] = useState<'All' | WorkCategory>('All');
  const categories = categoryOrder.filter((category) =>
    workItems.some((item) => item.category === category),
  );
  const visibleItems = workItems.filter((item) =>
    activeCategory === 'All' || item.category === activeCategory,
  );

  if (workItems.length === 0) {
    return (
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container-xl">
          <div className="relative overflow-hidden border-y border-[var(--viridian-950)]/15 py-12 sm:py-16">
            <div aria-hidden="true" className="absolute bottom-0 right-0 top-0 hidden w-1/3 border-l border-[var(--viridian-950)]/10 md:block" />
            <div className="relative max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">SELECTED WORK</p>
              <h2 className="mt-5 font-display text-3xl leading-tight text-[var(--viridian-950)] sm:text-4xl">
                Selected work will appear here as JLUXE projects and engagements are added.
              </h2>
              <Link href={siteConfig.nav.contact} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:text-[var(--gold)]">
                Let&apos;s Talk <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="container-xl">
        <div className="flex flex-col gap-5 border-b border-[var(--viridian-950)]/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[var(--gold)]">SELECTED WORK</p>
            <h2 className="mt-4 font-display text-4xl text-[var(--viridian-950)] sm:text-5xl">Projects &amp; engagements</h2>
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Filter work by category">
              {(['All', ...categories] as const).map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`min-h-10 border px-3 py-2 text-xs font-medium transition-colors ${activeCategory === category ? 'border-[var(--viridian-900)] bg-[var(--viridian-900)] text-white' : 'border-[var(--viridian-950)]/15 text-[var(--viridian-950)] hover:border-[var(--gold)]'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {visibleItems.map((item) => (
            <article key={item.id} className={`min-w-0 ${item.featured ? 'md:col-span-2' : ''}`}>
              {item.image && (
                <div className={`relative aspect-[4/3] overflow-hidden bg-[var(--sand)] ${item.featured ? 'md:aspect-[2/1]' : ''}`}>
                  <Image src={item.image} alt={item.title} fill sizes={item.featured ? '(min-width: 768px) 100vw, 100vw' : '(min-width: 768px) 50vw, 100vw'} className="object-cover" />
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[var(--muted)]">
                <span className="text-[var(--gold)]">{item.category}</span>
                {item.location && <span>{item.location}</span>}
                {item.year && <span>{item.year}</span>}
              </div>
              <h3 className="mt-3 font-display text-2xl text-[var(--viridian-950)] sm:text-3xl">{item.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}