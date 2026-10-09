import Link from 'next/link';
import type { ReactNode } from 'react';

const arrowIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type JluxeCtaLinkProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
};

export default function JluxeCtaLink({ href, children, icon = arrowIcon, className = '', target, rel }: JluxeCtaLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={`jluxe-cta touch-press group relative inline-flex min-h-12 min-w-[220px] items-center overflow-hidden rounded-[0.9em] bg-[var(--cream)] px-5 pr-14 text-sm font-semibold text-[var(--viridian-950)] shadow-[inset_0_0_1.6em_-0.6em_var(--gold)] transition-[transform,box-shadow] duration-300 hover:shadow-[inset_0_0_1.6em_-0.4em_var(--gold)] active:scale-[0.98] ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span aria-hidden="true" className="jluxe-cta-icon absolute right-1 top-1/2 z-0 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-[0.7em] bg-[var(--viridian-950)] text-[var(--cream)] shadow-[0.1em_0.1em_0.6em_0.2em_rgba(197,164,109,0.35)]">
        {icon}
      </span>
    </Link>
  );
}
