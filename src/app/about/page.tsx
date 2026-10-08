import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import JluxeCtaLink from '@/components/jluxe-cta-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { isConfiguredContact, siteConfig } from '@/lib/data';

export const metadata: Metadata = {
  title: 'About JLUXE | Business Solutions, Real Estate, Talent & Training',
  description: 'Learn about JLUXE, a Chennai-based business solutions and consulting company connecting people, businesses, professionals and institutions through practical, customized solutions.',
};

const capabilities = [
  { number: '01', title: 'Business Solutions', description: 'Helping businesses strengthen sales, marketing, customer relationships and business development.' },
  { number: '02', title: 'Talent & Staffing', description: 'Helping organizations find the right talent and access workforce solutions.' },
  { number: '03', title: 'Training & Development', description: 'Developing employees, professionals and students through practical, customized training.' },
  { number: '04', title: 'Real Estate', description: 'Supporting property buying, selling, promotion, sales and channel opportunities.' },
  { number: '05', title: 'Banking Solutions', description: 'Supporting customer acquisition, relationship management and business or financial service connections.' },
];

const reasons = [
  ['Industry Experience', 'Practical understanding across Real Estate, Sales, Marketing, HR, Banking and Business Development.'],
  ['Customer-Centric Approach', 'We focus on understanding the specific needs of every customer, business, institution and partner.'],
  ['Strong Business Network', 'Our network across real estate, corporate, banking, talent and education ecosystems helps us create meaningful connections.'],
  ['Professional Execution', 'From lead generation to recruitment and training, we emphasize structured processes and professional execution.'],
  ['Customized Solutions', 'Every business and customer is different. Our solutions can be customized according to specific requirements.'],
  ['Long-Term Relationships', 'We believe successful business is not just about completing a transaction—it is about building relationships that create long-term value.'],
];

const industries = [
  ['REAL ESTATE', 'Plots · Villas · Apartments · Commercial Properties · Channel Sales · CRM · Sales & Marketing'],
  ['BANKING & FINANCIAL SERVICES', 'Sales · Customer Acquisition · Relationship Management · Recruitment · Training'],
  ['CORPORATE', 'Recruitment · Staffing · Sales · Marketing · CRM · Leadership · Training'],
  ['EDUCATION', 'College Training · Employability · Career Development · Corporate Readiness'],
];

const audiences = [
  ['Real Estate Developers', 'Sales, marketing, channel partner and project promotion solutions.'],
  ['Property Buyers & Sellers', 'Professional assistance for buying and selling properties.'],
  ['Corporates & Businesses', 'Recruitment, staffing, training and business support services.'],
  ['Banks & Financial Institutions', 'Customer acquisition and property or financial service support.'],
  ['Educational Institutions', 'Training, career development and student counselling.'],
  ['Professionals & Job Seekers', 'Recruitment opportunities, career guidance and skill development.'],
];

const principles = [
  ['TRUST', 'Trust creates relationships.'],
  ['TRANSPARENCY', 'Transparency creates confidence.'],
  ['PROFESSIONALISM', 'Professionalism creates credibility.'],
  ['RESULTS', 'Results create long-term partnerships.'],
];

const ecosystem = ['People', 'Properties', 'Businesses', 'Talent', 'Opportunities'];
const propertyTypes = ['Plots', 'Villas', 'Apartments', 'Commercial Properties'];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`text-[11px] font-semibold tracking-[0.22em] ${light ? 'text-[var(--gold)]' : 'text-[var(--viridian-700)]'}`}>{children}</p>;
}

export default function AboutPage() {
  return (
    <main className="about-page overflow-hidden bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />

      <section className="hero-glow relative isolate overflow-hidden bg-[var(--viridian-950)] py-20 text-white sm:py-24 lg:py-28">
        <div className="hero-copy container-xl relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <div className="max-w-4xl">
            <Eyebrow light>ABOUT JLUXE</Eyebrow>
            <h1 className="mt-6 font-display text-[clamp(2.25rem,4.5vw,4.1rem)] leading-[1.03] tracking-[-0.035em]">
              Building relationships.<br />Creating opportunities.<br />Delivering results.
            </h1>
          </div>
          <p className="max-w-lg text-base leading-7 text-white/70 sm:text-lg sm:leading-8 lg:justify-self-end">
            JLUXE is a business ecosystem connecting people, properties, businesses, talent, opportunities and growth.
          </p>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-10 hidden h-[470px] w-[470px] rounded-full border border-white/[0.08] lg:block" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-6 top-32 hidden h-[330px] w-[330px] rounded-full border border-[var(--gold)]/20 lg:block" />
      </section>

      <section className="py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-8 md:grid-cols-[0.72fr_1.28fr] md:gap-14 lg:gap-20">
          <div className="about-company-heading border-l border-[var(--gold)]/35 bg-[var(--viridian-950)]/[0.035] py-5 pl-5 pr-3 sm:py-6 sm:pl-7"><Eyebrow>THE COMPANY</Eyebrow><h2 className="mt-5 max-w-md font-display text-4xl leading-[1.12] sm:text-5xl">Your partner for business, people and growth.</h2></div>
          <div className="about-profile-copy max-w-3xl border-l pl-6 pr-5 py-5 sm:pl-9 sm:pr-7">
            <p className="text-base leading-7 text-white/80 sm:text-lg sm:leading-8">JLUXE is a Chennai-based business solutions and consulting company focused on helping organizations, businesses, professionals and institutions achieve sustainable growth.</p>
            <p className="mt-5 text-base leading-7 text-white/80 sm:text-lg sm:leading-8">With an understanding of the Real Estate, Banking, Corporate and Education sectors, JLUXE brings together industry experience, professional networks and practical business solutions under one platform.</p>
            <p className="mt-5 text-base leading-7 text-white/80 sm:text-lg sm:leading-8">We work closely with businesses to understand their requirements and provide customized, result-oriented solutions that support business growth, improve customer engagement and strengthen organizational capabilities.</p>
            <p className="about-meta mt-7 border-t border-white/15 px-3 py-4 pt-4 text-xs font-medium tracking-[0.14em] text-[var(--gold)]">CHENNAI · TAMIL NADU</p>
          </div>
        </div>
      </section>

      <section className="about-contrast-section border-y border-white/10 bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <div className="grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div><Eyebrow light>WHAT WE DO</Eyebrow><h2 className="mt-4 max-w-lg font-display text-4xl leading-tight text-[var(--cream)] sm:text-5xl">Multiple capabilities.<br />One connected platform.</h2></div>
            <p className="max-w-xl text-sm leading-7 text-white/70 md:justify-self-end sm:text-base">Practical business and people-focused solutions, shaped around the requirements of organizations, professionals and institutions.</p>
          </div>
          <div className="mt-10 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" data-reveal-stagger>
            {capabilities.map((item, index) => {
              return <article key={item.number} data-reveal className="premium-card about-depth-card group relative flex min-h-56 flex-col p-5 sm:p-6">
                <span className="about-card-number text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">{item.number}</span>
                <h3 className="mt-8 font-display text-xl leading-snug text-[var(--cream)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/75">{item.description}</p>
                <span aria-hidden="true" className="absolute bottom-0 left-5 h-px w-0 bg-[var(--gold)] transition-all duration-300 group-hover:w-12 sm:left-6" />
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div className="relative mx-auto w-full max-w-[460px]">
            <div className="about-portrait-frame relative aspect-[4/5] overflow-hidden border border-[var(--viridian-950)]/20 bg-[var(--sand)]/35 p-4 sm:p-5">
              <div className="flex h-full items-end border border-[var(--viridian-950)]/10 p-5 sm:p-7">
                <p className="max-w-[15rem] text-xs leading-5 text-[var(--muted)]">Managing Director portrait</p>
              </div>
            </div>
            <p className="mt-3 text-[10px] tracking-[0.16em] text-[var(--muted)]">JLUXE LEADERSHIP</p>
          </div>
          <div className="about-profile-copy max-w-2xl border p-5 sm:p-7">
            <Eyebrow light>MEET OUR MANAGING DIRECTOR</Eyebrow>
            <h2 className="mt-4 font-display text-4xl leading-tight text-[var(--cream)] sm:text-5xl">Sarvesh Karthik N</h2>
            <p className="mt-3 text-sm font-medium tracking-[0.08em] text-white/70">Managing Director — JLUXE</p>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">Sarvesh Karthik N is a business professional and entrepreneur with experience across Real Estate, Sales &amp; Marketing, Business Consulting, Recruitment, Training, Corporate Services and Education-focused initiatives.</p>
            <JluxeCtaLink href="/about/managing-director" className="mt-7">Meet the Managing Director</JluxeCtaLink>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--viridian-950)]/10 bg-[var(--sand)]/25 py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Eyebrow>WHY JLUXE</Eyebrow><h2 className="mt-4 font-display text-4xl sm:text-5xl">One partner. Multiple solutions.</h2></div><p className="max-w-sm text-sm leading-6 text-[var(--muted)]">A practical, relationship-led approach across people, process and business.</p></div>
          <div className="mt-10 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" data-reveal-stagger>
            {reasons.map(([title, description], index) => {
              return <article key={title} data-reveal className="premium-card about-depth-card group p-5 sm:p-7">
                <p className="about-card-number text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-5 font-display text-2xl text-[var(--cream)] transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:group-hover:translate-y-0 motion-reduce:transition-none">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/75 transition-colors group-hover:text-white/90">{description}</p>
                <span aria-hidden="true" className="mt-6 block h-px w-8 bg-[var(--gold)] transition-all group-hover:w-14" />
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr] md:items-end"><div><Eyebrow light>OUR BUSINESS PHILOSOPHY</Eyebrow><h2 className="mt-4 font-display text-4xl text-[var(--cream)] sm:text-5xl">Principles, not promises.</h2></div><p className="max-w-lg text-sm leading-7 text-white/65 md:justify-self-end sm:text-base">The principles that guide the way we work.</p></div>
          <div className="mt-10 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" data-reveal-stagger>
            {principles.map(([title, description]) => <article key={title} data-reveal className="premium-card about-depth-card-dark group my-2 p-5 sm:mx-2 sm:p-6"><h3 className="font-display text-2xl text-[var(--viridian-950)] transition-transform duration-300 group-hover:translate-x-1">{title}</h3><span aria-hidden="true" className="mt-4 block h-px w-8 bg-[var(--gold)] transition-all group-hover:w-14" /><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--viridian-950)]/10 bg-white/35 py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr] md:items-end"><div><Eyebrow>OUR INDUSTRY EXPERTISE</Eyebrow><h2 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">Built around industries where relationships matter.</h2></div><p className="max-w-lg text-sm leading-7 text-[var(--muted)] md:justify-self-end">JLUXE supports organizations across multiple sectors.</p></div>
          <div className="mt-10 grid gap-2 sm:grid-cols-2" data-reveal-stagger>
            {industries.map(([title, description], index) => {
              return <article key={title} data-reveal className="premium-card about-depth-card group relative m-1 min-h-48 p-5 sm:p-7">
                <p className="about-card-number text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-6 font-display text-2xl text-[var(--cream)]">{title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 group-hover:text-white/90">{description}</p>
                <ArrowRight aria-hidden="true" className="absolute bottom-6 right-6 h-4 w-4 text-[var(--gold)] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="about-contrast-section border-y border-white/10 bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl">
          <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr] md:items-end"><div><Eyebrow light>WHO WE SERVE</Eyebrow><h2 className="mt-4 max-w-lg font-display text-4xl leading-tight text-[var(--cream)] sm:text-5xl">Different requirements. One connected partner.</h2></div><p className="max-w-md text-sm leading-7 text-white/70 md:justify-self-end">We work with people and organizations across the JLUXE ecosystem.</p></div>
          <div className="mt-9 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" data-reveal-stagger>
            {audiences.map(([title, description], index) => {
              return <article key={title} data-reveal className="premium-card about-depth-card group p-5 sm:p-6">
                <p className="about-card-number text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="mt-4 font-display text-xl text-[var(--cream)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">{description}</p>
                <span aria-hidden="true" className="mt-5 block h-px w-7 bg-[var(--gold)] transition-all group-hover:w-12" />
              </article>;
            })}
          </div>
        </div>
      </section>

      <section className="about-vision-mission relative isolate overflow-hidden bg-[var(--cream)] py-16 text-[var(--viridian-950)] sm:py-20 lg:py-24" data-reveal>
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-10 h-44 w-44 rounded-full border border-[var(--viridian-950)]/[0.06] sm:right-[8%] sm:h-52 sm:w-52" />
        <div aria-hidden="true" className="pointer-events-none absolute right-7 top-[4.5rem] h-28 w-28 rounded-full border border-[var(--gold)]/10 sm:right-[calc(8%+2rem)] sm:top-20 sm:h-36 sm:w-36" />
        <div className="container-xl relative z-10">
          <div className="divide-y divide-[var(--viridian-950)]/15">
            <article className="about-vision-mission-row group grid gap-4 py-8 first:pt-0 sm:gap-6 sm:py-10 md:grid-cols-[0.42fr_1.58fr] md:gap-10 lg:grid-cols-[0.38fr_1.62fr] lg:gap-14">
              <div>
                <Eyebrow>OUR VISION</Eyebrow>
                <span aria-hidden="true" className="mt-4 block h-px w-8 bg-[var(--gold)]/55 transition-all duration-[450ms] ease-[cubic-bezier(.22,.8,.24,1)] group-hover:w-14 group-hover:bg-[var(--gold)]" />
              </div>
              <p className="max-w-4xl font-display text-2xl leading-relaxed text-[var(--viridian-950)] transition-transform duration-[450ms] ease-[cubic-bezier(.22,.8,.24,1)] group-hover:translate-x-1 sm:text-3xl">To become a trusted business solutions and professional training partner, helping organizations and individuals achieve meaningful and sustainable growth.</p>
            </article>
            <article className="about-vision-mission-row group grid gap-4 py-8 last:pb-0 sm:gap-6 sm:py-10 md:grid-cols-[0.42fr_1.58fr] md:gap-10 lg:grid-cols-[0.38fr_1.62fr] lg:gap-14">
              <div>
                <Eyebrow>OUR MISSION</Eyebrow>
                <span aria-hidden="true" className="mt-4 block h-px w-8 bg-[var(--gold)]/55 transition-all duration-[450ms] ease-[cubic-bezier(.22,.8,.24,1)] group-hover:w-14 group-hover:bg-[var(--gold)]" />
              </div>
              <p className="max-w-4xl font-display text-2xl leading-relaxed text-[var(--viridian-950)] transition-transform duration-[450ms] ease-[cubic-bezier(.22,.8,.24,1)] group-hover:translate-x-1 sm:text-3xl">To deliver professional, practical and customized solutions across Sales, Marketing, CRM, Banking, Recruitment, Staffing and Training while creating value for businesses, professionals and institutions.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--viridian-950)]/10 bg-[var(--viridian-950)]/[0.035] py-16 sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
          <div><Eyebrow>THE JLUXE ECOSYSTEM</Eyebrow><h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">One brand.<br />Multiple opportunities.</h2></div>
          <div><p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">Distinct capabilities sit under one brand, creating a clear point of entry for people and organisations with different requirements.</p><ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">{ecosystem.map((item, index) => <li key={item} className="premium-card about-depth-card group flex min-h-16 items-center justify-between px-4 sm:min-h-20 sm:px-5"><span className="text-sm font-medium text-[var(--cream)]">{item}</span><span className="text-[10px] font-semibold tracking-[0.14em] text-[var(--gold)]">0{index + 1}</span></li>)}</ul></div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24" data-reveal>
        <div className="container-xl grid gap-9 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div><Eyebrow light>OUR REAL ESTATE FOCUS</Eyebrow><h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Buy.<br />Sell.<br />Promote.<br />Connect.</h2></div>
          <div><p className="text-base leading-7 text-white/75 sm:text-lg">JLUXE supports transactions and business opportunities across:</p><ul className="mt-5 grid grid-cols-2 gap-2">{propertyTypes.map((type) => <li key={type} className="premium-card about-depth-card-dark flex min-h-14 items-center px-4 text-sm text-[var(--viridian-950)] sm:min-h-16">{type}</li>)}</ul><p className="mt-6 max-w-xl text-sm leading-7 text-white/70 sm:text-base">Whether you are looking to buy a property, sell your existing property, promote a real estate project, or build a strong sales network, JLUXE supports the process.</p><Link href="/services/real-estate" className="touch-press mt-6 inline-flex min-h-11 items-center gap-2 border-b border-[var(--gold)] pb-1 text-sm font-semibold text-white transition-colors hover:text-[var(--gold)]">Explore Real Estate <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="hero-glow bg-[var(--viridian-950)] py-16 text-white sm:py-20" data-reveal>
        <div className="container-xl flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
          <div><Eyebrow light>LET&apos;S GROW TOGETHER</Eyebrow><h2 className="mt-4 font-display text-3xl leading-tight text-[var(--cream)] sm:text-4xl">Let&apos;s start a conversation.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">Whether you are a business looking to increase sales, an organization looking for the right talent, a company seeking trained professionals, or a college preparing students for successful careers, JLUXE is ready to support your journey.</p></div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row"><JluxeCtaLink href={siteConfig.nav.contact}>Let&apos;s Talk</JluxeCtaLink>{isConfiguredContact(siteConfig.contact.whatsapp) && <a href={siteConfig.contact.whatsapp} target="_blank" rel="noreferrer" className="touch-press inline-flex min-h-12 items-center justify-center gap-2 border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"><MessageCircle className="h-4 w-4" />WhatsApp</a>}</div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
