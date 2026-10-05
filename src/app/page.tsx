import { ArrowRight, Handshake, Lightbulb, MoveUpRight, UsersRound } from 'lucide-react';
import HeroCarousel from '@/components/hero-carousel';
import ServicesCarousel from '@/components/services-carousel';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';

export default function Home(){
 return <main>
    <SiteHeader />
  <HeroCarousel/>
  <ServicesCarousel/>

  <section id="work" className="bg-[var(--viridian-950)] py-24 text-white" data-reveal><div className="container-xl"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><div className="flex items-center gap-3"><span aria-hidden="true" className="h-px w-10 bg-[var(--gold)]/60" /><p className="text-xs font-bold tracking-[.25em] text-[var(--gold)]">WHAT WE BRING TO THE TABLE</p></div><h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">From opportunity to action.</h2></div><p className="max-w-md text-sm leading-6 text-white/60">A few of the ways JLUXE supports its clients, partners and communities across different services.</p></div><div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4" data-reveal-stagger><article data-reveal className="premium-card bg-[var(--viridian-950)] p-8"><Lightbulb className="h-7 w-7 text-[var(--gold)]"/><h3 className="mt-12 font-display text-2xl">Create</h3><p className="mt-3 text-sm leading-6 text-white/60">Build ideas, brands and spaces with purpose.</p></article><article data-reveal className="premium-card bg-[var(--viridian-950)] p-8"><UsersRound className="h-7 w-7 text-[var(--gold)]"/><h3 className="mt-12 font-display text-2xl">Connect</h3><p className="mt-3 text-sm leading-6 text-white/60">Bring people and opportunities into the same conversation.</p></article><article data-reveal className="premium-card bg-[var(--viridian-950)] p-8"><Handshake className="h-7 w-7 text-[var(--gold)]"/><h3 className="mt-12 font-display text-2xl">Support</h3><p className="mt-3 text-sm leading-6 text-white/60">Provide practical support across business and professional needs.</p></article><article data-reveal className="premium-card bg-[var(--viridian-950)] p-8"><MoveUpRight className="h-7 w-7 text-[var(--gold)]"/><h3 className="mt-12 font-display text-2xl">Grow</h3><p className="mt-3 text-sm leading-6 text-white/60">Help people and organisations take their next step.</p></article></div></div></section>

  <section className="relative overflow-hidden bg-[var(--viridian-900)] py-24 text-white sm:py-28" data-reveal>
    <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-12 hidden h-[380px] w-[380px] rounded-full border border-white/[0.08] lg:block" />
    <div aria-hidden="true" className="pointer-events-none absolute -right-6 top-28 hidden h-52 w-52 rounded-full border border-[var(--gold)]/25 lg:block" />
    <div className="container-xl relative z-10">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px w-10 bg-[var(--gold)]/60" />
        <p className="text-xs font-bold tracking-[.25em] text-[var(--gold)]">THE JLUXE STORY</p>
      </div>
      <h2 className="mt-8 max-w-4xl font-display text-4xl leading-[1.1] tracking-[-0.01em] sm:text-5xl lg:text-6xl" data-reveal>
        Building relationships.<br />Creating opportunities.<br />Delivering results.
      </h2>
      <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between" data-reveal>
        <p className="max-w-xl text-base leading-7 text-white/70">
          JLUXE is a business ecosystem connecting people, properties, businesses, talent, opportunities and growth.
        </p>
        <a href="/about" className="touch-press inline-flex w-fit items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]">About JLUXE <ArrowRight className="h-4 w-4" /></a>
      </div>
    </div>
  </section>

  <section id="contact" className="bg-[var(--cream)] py-20 text-[var(--viridian-950)] sm:py-24" data-reveal><div className="container-xl flex flex-col justify-between gap-8 md:flex-row md:items-center"><div><div className="flex items-center gap-3"><span aria-hidden="true" className="h-px w-10 bg-[var(--gold)]/60" /><p className="text-xs font-bold tracking-[.25em] text-[var(--gold)]">LET&apos;S TALK</p></div><h2 className="mt-3 font-display text-4xl sm:text-5xl">Have a requirement in mind?</h2><p className="mt-3 text-[var(--muted)]">Tell us what you need. We&apos;ll help you find the right next step.</p></div><a href="/contact" className="touch-press inline-flex w-fit items-center gap-2 rounded-full bg-[var(--viridian-950)] px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)]">Contact JLUXE <ArrowRight className="h-4 w-4"/></a></div></section>

  <SiteFooter />
 </main>
}