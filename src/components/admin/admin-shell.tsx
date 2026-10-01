import Link from 'next/link';
import { logoutAdminAction } from '@/app/admin/actions';
import type { getAdminSession } from '@/lib/admin-session';

type AdminUser = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;

const sections = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Properties', href: '/admin/properties' },
  { label: 'Our Work', href: '/admin/our-work' },
  { label: 'Enquiries', href: '/admin/enquiries' },
  { label: 'Media' },
  { label: 'Services', href: '/admin/services' },
] as const;

export default function AdminShell({
  admin,
  active,
  children,
}: {
  admin: AdminUser;
  active: 'Dashboard' | 'Enquiries' | 'Properties' | 'Services' | 'Our Work';
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--cream)] text-[var(--viridian-950)]">
      <header className="border-b border-[var(--viridian-950)]/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="font-display text-xl font-semibold tracking-[0.12em]">JLUXE</p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)]">PRIVATE ADMINISTRATION</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{admin.displayName}</p>
              <p className="text-xs text-[var(--muted)]">{admin.role}</p>
            </div>
            <form action={logoutAdminAction}>
              <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--viridian-950)]/15 px-4 text-sm font-medium transition-colors hover:border-[var(--viridian-950)]/40">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-12">
        <aside aria-label="Admin navigation">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-[var(--muted)]">WORKSPACE</p>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {sections.map((section) => 'href' in section ? (
              <Link
                key={section.label}
                href={section.href}
                aria-current={active === section.label ? 'page' : undefined}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${active === section.label ? 'bg-[var(--viridian-900)] text-white' : 'text-[var(--muted)] transition-colors hover:bg-[var(--viridian-950)]/5 hover:text-[var(--viridian-950)]'}`}
              >
                {section.label}
              </Link>
            ) : (
              <span key={section.label} aria-disabled="true" className="rounded-lg px-3 py-2.5 text-sm text-[var(--muted)]">
                {section.label}<span className="ml-2 text-[10px]">Later</span>
              </span>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}