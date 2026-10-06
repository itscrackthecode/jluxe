import type { Metadata } from 'next';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Leadership',
  description:
    'Meet the leadership behind JLUXE and learn about the vision, experience and philosophy shaping the business.',
};

export default function LeadershipPage() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="bg-[var(--viridian-950)] py-24 md:py-32">
          <div className="container-xl">
            <p className="text-xs font-medium tracking-[0.22em] text-[var(--gold)]">
              LEADERSHIP
            </p>

            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-tight text-[var(--cream)] md:text-7xl">
              Experience. Expertise. Execution.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-[var(--cream)]/70 md:text-lg">
              Meet the leadership behind JLUXE and the vision shaping its
              journey across businesses, people, opportunities and growth.
            </p>
          </div>
        </section>
        <section className="bg-[var(--cream)] py-20 md:py-28">
  <div className="container-xl">
    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">

      {/* Portrait Placeholder */}
      <div className="relative aspect-[4/5] overflow-hidden border border-[var(--viridian-950)]/15 bg-[var(--sand)]/35">
        <div
          aria-hidden="true"
          className="absolute inset-5 border border-[var(--viridian-950)]/10"
        />
      </div>

      {/* Profile Content */}
      <div>
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--gold)]">
          MANAGING DIRECTOR
        </p>

        <h2 className="mt-4 font-display text-4xl leading-tight text-[var(--viridian-950)] md:text-6xl">
          Sarvesh Karthik N
        </h2>

        <p className="mt-3 text-sm font-medium tracking-[0.08em] text-[var(--muted)]">
          Managing Director — JLUXE
        </p>

        <p className="mt-8 max-w-2xl font-display text-2xl leading-relaxed text-[var(--viridian-950)] md:text-3xl">
          Building Businesses. Developing People. Creating Opportunities.
        </p>

        <div className="mt-8 max-w-2xl space-y-5 text-base leading-8 text-[var(--muted)]">
          <p>
            Sarvesh Karthik N is a business professional and entrepreneur with
            experience across Real Estate, Sales & Marketing, Business
            Consulting, Recruitment, Training, Corporate Services and
            Education-focused initiatives.
          </p>

          <p>
            As the Managing Director of JLUXE, Sarvesh brings together his
            experience in business development, customer engagement, sales,
            people management and professional training to create an
            integrated platform that connects properties, businesses,
            professionals, institutions and opportunities.
          </p>

          <p>
            His approach combines entrepreneurial thinking with hands-on
            execution, with a focus on professionalism, transparency, trusted
            relationships and sustainable growth.
          </p>
        </div>
      </div>

    </div>
  </div>
</section>
<section className="bg-[var(--sand)]/35 py-20 md:py-28">
  <div className="container-xl">

    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">

      {/* Introduction */}
      <div>
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--gold)]">
          AREAS OF FOCUS
        </p>

        <h2 className="mt-4 max-w-md font-display text-4xl leading-tight text-[var(--viridian-950)] md:text-5xl">
          Where experience meets opportunity.
        </h2>

        <p className="mt-6 max-w-md text-base leading-8 text-[var(--muted)]">
          His work brings together business development, people, sales,
          training and strategic relationships to create meaningful
          opportunities across the JLUXE ecosystem.
        </p>
      </div>

      {/* Focus Areas */}
      <div className="grid border-t border-[var(--viridian-950)]/15 sm:grid-cols-2">

        <div className="border-b border-[var(--viridian-950)]/15 py-6 sm:border-r sm:pr-8">
          <p className="text-sm font-semibold text-[var(--viridian-950)]">
            Business Development
          </p>
        </div>

        <div className="border-b border-[var(--viridian-950)]/15 py-6 sm:pl-8">
          <p className="text-sm font-semibold text-[var(--viridian-950)]">
            Sales & Marketing
          </p>
        </div>

        <div className="border-b border-[var(--viridian-950)]/15 py-6 sm:border-r sm:pr-8">
          <p className="text-sm font-semibold text-[var(--viridian-950)]">
            People & Talent
          </p>
        </div>

        <div className="border-b border-[var(--viridian-950)]/15 py-6 sm:pl-8">
          <p className="text-sm font-semibold text-[var(--viridian-950)]">
            Training & Development
          </p>
        </div>

        <div className="py-6 sm:border-r sm:pr-8">
          <p className="text-sm font-semibold text-[var(--viridian-950)]">
            Real Estate
          </p>
        </div>

        <div className="py-6 sm:pl-8">
          <p className="text-sm font-semibold text-[var(--viridian-950)]">
            Strategic Partnerships
          </p>
        </div>

      </div>

    </div>
  </div>
</section>
<section className="bg-[var(--viridian-950)] py-24 md:py-32">
  <div className="container-xl">
    <div className="max-w-4xl">
      <p className="text-xs font-medium tracking-[0.22em] text-[var(--gold)]">
        LEADERSHIP PHILOSOPHY
      </p>

      <blockquote className="mt-8 font-display text-3xl leading-relaxed text-[var(--cream)] md:text-5xl md:leading-[1.25]">
        “Success is built by creating value for people, building trusted
        relationships and turning opportunities into sustainable growth.”
      </blockquote>
    </div>
  </div>
</section>
<section className="bg-[var(--cream)] py-20 md:py-28">
  <div className="container-xl">
    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">

      {/* Section Introduction */}
      <div>
        <p className="text-xs font-medium tracking-[0.22em] text-[var(--gold)]">
          VISION FOR JLUXE
        </p>

        <h2 className="mt-4 max-w-md font-display text-4xl leading-tight text-[var(--viridian-950)] md:text-5xl">
          Building a platform for meaningful growth.
        </h2>
      </div>

      {/* Vision Content */}
      <div className="max-w-2xl">
        <p className="text-lg leading-8 text-[var(--viridian-950)]">
          Under Sarvesh Karthik N's leadership, JLUXE aims to evolve into a
          trusted multi-service business platform that brings together
          people, businesses, properties, talent and opportunities.
        </p>

        <p className="mt-6 text-base leading-8 text-[var(--muted)]">
          The vision is to create meaningful connections, open pathways for
          growth and build relationships that create long-term value for
          individuals and businesses.
        </p>

        <div className="mt-14 border-t border-[var(--viridian-950)]/15 pt-10">
          <p className="font-display text-4xl tracking-[0.08em] text-[var(--viridian-950)] md:text-5xl">
            CONNECT.
          </p>

          <p className="mt-2 font-display text-4xl tracking-[0.08em] text-[var(--viridian-950)] md:text-5xl">
            CREATE.
          </p>

          <p className="mt-2 font-display text-4xl tracking-[0.08em] text-[var(--gold)] md:text-5xl">
            GROW.
          </p>

          <p className="mt-6 max-w-lg text-sm leading-7 text-[var(--muted)]">
            Connecting the right people.
            <br />
            Creating the right opportunities.
            <br />
            Growing businesses and careers.
          </p>
        </div>
      </div>

    </div>
  </div>
</section>
      </main>

      <SiteFooter />
    </>
  );
}