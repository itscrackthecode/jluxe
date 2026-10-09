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
      <div className="max-w-4xl text-[#f5f1e8]">
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">DASHBOARD</p>
        <h1 className="mt-3 font-display text-4xl text-white">Welcome, {admin.displayName}</h1>
        <p className="mt-2 text-sm text-[#9caaa4]">Signed in as {admin.role.toLowerCase()}.</p>

        <div className="mt-8 border-y border-white/15 py-8">
          <h2 className="font-display text-2xl text-white">Your workspace is ready</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9caaa4]">
            Dashboard access is active. Review enquiries, manage property listings, work portfolio, and system media.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <Link
            href="/admin/enquiries"
            className="block max-w-xl rounded-lg border border-white/10 bg-[#08201b] p-5 transition-colors hover:border-[var(--gold)]/60 hover:bg-[#0c2a23]"
          >
            <span className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)]">NEW ENQUIRIES</span>
            <span className="mt-2 flex items-baseline justify-between gap-4">
              <span className="font-display text-3xl text-white">{newEnquiries}</span>
              <span className="text-sm font-medium text-[#f5f1e8]">
                Open enquiries <span aria-hidden="true">&rarr;</span>
              </span>
            </span>
          </Link>

          <Link
            href="/admin/properties"
            className="block max-w-xl rounded-lg border border-white/10 bg-[#08201b] p-5 transition-colors hover:border-[var(--gold)]/60 hover:bg-[#0c2a23]"
          >
            <span className="text-xs font-semibold tracking-[0.16em] text-[var(--gold)]">PROPERTY LISTINGS</span>
            <span className="mt-2 flex items-baseline justify-between gap-4">
              <span className="font-display text-2xl text-white">Manage properties</span>
              <span className="text-sm font-medium text-[#f5f1e8]">
                Open listings <span aria-hidden="true">&rarr;</span>
              </span>
            </span>
          </Link>
        </div>

        <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
          {[
            ['Properties', counts.properties, '/admin/properties'],
            ['Our Work', counts.portfolio, '/admin/our-work'],
            ['Enquiries', counts.enquiries, '/admin/enquiries'],
          ].map(([label, count, href]) => (
            <Link
              key={label}
              href={href as string}
              className="rounded-lg border border-white/10 bg-[#08201b] p-4 transition-colors hover:border-[var(--gold)]/60 hover:bg-[#0c2a23]"
            >
              <span className="text-[10px] font-semibold tracking-[0.16em] text-[#9caaa4]">{label}</span>
              <span className="mt-2 block font-display text-3xl text-white">{count}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}