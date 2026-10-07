import Link from 'next/link';
import { logoutAdminAction } from '@/app/admin/actions';
import type { getAdminSession } from '@/lib/admin-session';

type AdminUser = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;

const sections = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Properties', href: '/admin/properties' },
  { label: 'Our Work', href: '/admin/our-work' },
  { label: 'Enquiries', href: '/admin/enquiries' },
  { label: 'Media', href: '/admin/media' },
] as const;

export default function AdminShell({
  admin,
  active,
  children,
}: {
  admin: AdminUser;
  active: 'Dashboard' | 'Enquiries' | 'Properties' | 'Our Work' | 'Media';
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#061815] text-[#f5f1e8]">
      <header className="border-b border-white/10 bg-[#08221d]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div>
            <p className="font-display text-xl font-semibold tracking-[0.12em] text-white">JLUXE</p>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--gold)]">PRIVATE ADMINISTRATION</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-[#f5f1e8]">{admin.displayName}</p>
              <p className="text-xs text-[#9caaa4]">{admin.role}</p>
            </div>
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 px-4 text-sm font-medium text-[#f5f1e8] transition-colors hover:bg-white/10 hover:border-white/40"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-12">
        <aside aria-label="Admin navigation">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-[#9caaa4]">WORKSPACE</p>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {sections.map((section) => {
              const isActive = active === section.label;
              return (
                <Link
                  key={section.label}
                  href={section.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border border-[var(--gold)]/40 bg-[var(--viridian-800)] text-white shadow-sm'
                      : 'text-[#9caaa4] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}