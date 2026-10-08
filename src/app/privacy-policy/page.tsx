import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How JLUXE handles information submitted through its website.',
};

const sections = [
  {
    title: 'Information you provide',
    paragraphs: [
      'When you submit a Contact or Enquiry form, the site collects your name, email address, contact number, the service you are interested in, and your message. An enquiry may also be associated with a property reference.',
      'The Sell Property form collects your name, email address, contact number, property type, location, starting price, and any plot or land area and description you choose to provide. If you add photos, the site processes the images and their file and image details as part of your submission.',
      'Property listings and related enquiry records are stored and managed by JLUXE. The site also stores administrative account details needed to operate the restricted admin area, including account identity, role, active status, and authentication data.',
    ],
  },
  {
    title: 'How information is used',
    paragraphs: [
      'JLUXE uses submitted information to respond to enquiries, review seller property submissions, manage property listings and related media, provide and administer its services, and operate and secure the website. Enquiry details are also sent to JLUXE by email so the team can respond.',
    ],
  },
  {
    title: 'Storage and service providers',
    paragraphs: [
      'Enquiries, property submissions, listing information, and related records are stored in the PostgreSQL database configured for the website. Uploaded property and site images are stored and delivered through Cloudinary. Resend is used to deliver enquiry notification emails and receives the information included in those notifications, such as the submitter’s name, email, phone number, service interest, message, and, where applicable, property reference.',
      'These providers process information to support the functions described above. Their own terms and privacy practices may also apply to their services.',
    ],
  },
  {
    title: 'Cookies and security',
    paragraphs: [
      'The restricted admin area uses a session cookie to keep an authenticated administrator signed in. This cookie is limited to the admin area and is configured as HTTP-only, with secure and same-site protections. The site does not currently implement a public cookie-consent feature or a separate analytics or advertising tracking system.',
      'JLUXE uses access controls and server-side security measures in the application, and its service providers apply their own safeguards. No method of transmission or storage can be guaranteed to be completely secure.',
    ],
  },
  {
    title: 'Retention',
    paragraphs: [
      'The website does not implement a published automatic retention schedule. Information may remain in the database or Cloudinary while it is needed to handle an enquiry or property submission, manage listings and services, maintain records, or protect the website, and until JLUXE removes it. TODO: JLUXE to set and document retention periods for enquiries, seller submissions, admin records, and uploaded media.',
    ],
  },
  {
    title: 'Your requests and contact',
    paragraphs: [
      'You may use the Contact page to ask about personal information submitted through the website, or to request access, correction, or deletion. JLUXE will review requests in light of the applicable law and its operational or record-keeping needs. The Contact page provides the current enquiry mechanism without publishing an unverified direct contact detail.',
    ],
  },
  {
    title: 'Updates',
    paragraphs: [
      'JLUXE may update this policy when the website or its data handling changes. The current version will be published on this page; please review it periodically.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-[var(--cream)] text-[var(--viridian-950)]">
      <SiteHeader />
      <section className="bg-[var(--viridian-950)] py-16 text-white sm:py-20 lg:py-24">
        <div className="container-xl">
          <p className="text-xs font-semibold tracking-[0.24em] text-[var(--gold)]">LEGAL</p>
          <h1 className="mt-5 font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">Privacy Policy</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">How JLUXE handles information submitted through this website.</p>
        </div>
      </section>
      <section className="py-12 sm:py-16" data-reveal>
        <div className="container-xl mx-auto max-w-4xl">
          <div className="rounded-[24px] bg-white p-6 shadow-[0_18px_55px_rgba(6,47,41,0.06)] sm:p-10">
            <p className="text-sm leading-7 text-[var(--muted)]">This policy applies to information handled through the JLUXE website, including its enquiry, property submission, listing, media, and administrative functions.</p>
            <div className="mt-8 space-y-8">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="font-display text-2xl text-[var(--viridian-950)]">{section.title}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </div>
                  {section.title === 'Your requests and contact' && <p className="mt-3 text-sm leading-7 text-[var(--muted)]">TODO: Confirm the appropriate legal operator name and privacy or grievance contact details before publication.</p>}
                  {section.title === 'Your requests and contact' && <Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-[var(--viridian-800)] underline decoration-[var(--gold)] underline-offset-4 hover:text-[var(--gold)]">Go to the Contact page</Link>}
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
