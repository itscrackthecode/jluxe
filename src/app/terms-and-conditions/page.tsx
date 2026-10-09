import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms for using the JLUXE website and its information and services.',
};

const sections = [
  {
    title: 'Using this website',
    paragraphs: [
      'These terms apply when you access or use the JLUXE website. By using it, you agree to use the site lawfully and in a way that does not interfere with its operation or other users’ access.',
    ],
  },
  {
    title: 'Property listings and information',
    paragraphs: [
      'Property listings are provided for general information and may include information or materials supplied by owners, developers, representatives, or other third parties. JLUXE may present a property in a channel partner, authorized representative, or other capacity as indicated for that listing; the website does not establish a particular relationship for every property.',
      'Availability, price, specifications, location details, images, and other listing information can change and may not be complete or current. You should independently verify material details with JLUXE and the relevant owner or representative before making a decision. A listing is not a guarantee that a property remains available and is not, by itself, an offer, reservation, or contract.',
    ],
  },
  {
    title: 'Enquiries and seller submissions',
    paragraphs: [
      'Submitting an enquiry does not create an agency, advisory, representation, or other contractual relationship. JLUXE may contact you about the enquiry and relevant services.',
      'A property submission, including photographs, is provided for JLUXE to review. Submission does not guarantee publication, acceptance, or a listing or representation arrangement. You should only submit information and media that you are entitled to provide and that are accurate to the best of your knowledge.',
    ],
  },
  {
    title: 'Services',
    paragraphs: [
      'The website describes JLUXE services, including real estate, business, recruitment and training, and interiors. Descriptions are general information about the services; the scope, availability, and terms of any specific engagement are agreed separately with JLUXE.',
    ],
  },
  {
    title: 'Intellectual property',
    paragraphs: [
      'Website text, design, branding, and other materials are owned by JLUXE, licensed to it, or used with permission by their respective rights holders. You may view and use the site for personal, non-commercial purposes. You must not reproduce, distribute, modify, or commercially exploit protected material without permission, except where applicable law allows it.',
    ],
  },
  {
    title: 'Prohibited use and third parties',
    paragraphs: [
      'You must not misuse the website, attempt unauthorized access, interfere with its security or availability, submit unlawful or misleading material, or use the site to infringe another person’s rights.',
      'The website may link to third-party websites or rely on third-party services to provide features such as media delivery and enquiry notifications. Those third parties operate under their own terms and policies. JLUXE is not responsible for the content or operation of external websites it does not control.',
    ],
  },
  {
    title: 'Availability and liability',
    paragraphs: [
      'JLUXE aims to keep the website and its information useful and available, but does not guarantee uninterrupted access or that every item of information is error-free, complete, or current. To the extent permitted by applicable law, JLUXE is not responsible for indirect or consequential loss arising from use of, or inability to use, the website or reliance on general listing information. Nothing in these terms limits liability that cannot lawfully be limited.',
    ],
  },
  {
    title: 'Changes and governing law',
    paragraphs: [
      'JLUXE may change website content, services, or these terms from time to time. Updated terms will be published on this page and apply from publication to subsequent use of the website.',
      'TODO: Confirm the applicable governing law and court jurisdiction before publication. No specific jurisdiction is stated here because the project does not establish one.',
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />
      <section className="bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24">
        <div className="container-xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">LEGAL</p>
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">Terms &amp; Conditions</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">Terms for using the JLUXE website and its information and services.</p>
        </div>
      </section>
      <section className="py-12 sm:py-16" data-reveal>
        <div className="container-xl mx-auto max-w-4xl">
          <div className="rounded-[24px] bg-white p-6 shadow-[0_18px_55px_rgba(6,47,41,0.06)] sm:p-10">
            <p className="text-sm leading-7 text-[var(--muted)]">These terms apply to use of the JLUXE website. Please read them together with the <Link href="/privacy-policy" className="font-semibold text-[var(--viridian-800)] underline decoration-[var(--gold)] underline-offset-4 hover:text-[var(--gold)]">Privacy Policy</Link>.</p>
            <div className="mt-8 space-y-8">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-display text-2xl text-[var(--viridian-950)]">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
