import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import { getAdminSession } from '@/lib/admin-session';
import { countNewEnquiries } from '@/lib/db/queries/enquiries';
import { getAdminDashboardCounts } from '@/lib/db/queries/dashboard';

export const metadata = {
  title: { absolute: 'Admin Dashboard | JLUXE' },
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  const [newEnquiries, counts] = await Promise.all([countNewEnquiries(), getAdminDashboardCounts()]);

  return (
    <AdminShell admin={admin} active="Dashboard">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">DASHBOARD</p>
          <h1 className="mt-3 font-display text-4xl">Welcome, {admin.displayName}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Signed in as {admin.role.toLowerCase()}.</p>
          <div className="mt-8 border-y border-[var(--viridian-950)]/15 py-8">
            <h2 className="font-display text-2xl">Your workspace is ready</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Dashboard access is active. Management tools will appear here as each admin section is introduced.
            </p>
          </div>
          <Link href="/admin/enquiries" className="mt-6 block max-w-xl border-b border-[var(--viridian-950)]/15 py-5 transition-colors hover:border-[var(--gold)]">
            <span className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)]">NEW ENQUIRIES</span>
            <span className="mt-2 flex items-baseline justify-between gap-4">
              <span className="font-display text-3xl">{newEnquiries}</span>
              <span className="text-sm font-medium">Open enquiries <span aria-hidden="true">&rarr;</span></span>
            </span>
          </Link>
          <Link href="/admin/properties" className="block max-w-xl border-b border-[var(--viridian-950)]/15 py-5 transition-colors hover:border-[var(--gold)]">
            <span className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)]">PROPERTY LISTINGS</span>
            <span className="mt-2 flex items-baseline justify-between gap-4">
              <span className="font-display text-2xl">Manage properties</span>
              <span className="text-sm font-medium">Open listings <span aria-hidden="true">&rarr;</span></span>
            </span>
          </Link>
          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ['Properties', counts.properties, '/admin/properties'],
              ['Our Work', counts.portfolio, '/admin/our-work'],
              ['Enquiries', counts.enquiries, '/admin/enquiries'],
            ].map(([label, count, href]) => <Link key={label} href={href as string} className="border border-[var(--viridian-950)]/10 bg-white p-4 transition-colors hover:border-[var(--gold)]"><span className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)]">{label}</span><span className="mt-2 block font-display text-3xl">{count}</span></Link>)}
          </div>
    </AdminShell>
  );
}