import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import CareersAdmin from '@/components/admin/careers-admin';
import { getAdminSession, hasAdminPermission } from '@/lib/admin-session';

export const metadata = {
  title: { absolute: 'Careers | JLUXE Admin' },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminCareersPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <AdminShell admin={admin} active="Careers">
      {!hasAdminPermission(admin.role, 'edit-content') ? (
        <p role="alert" className="rounded-md border border-red-400/30 bg-red-950/30 p-4 text-sm text-red-200">
          You do not have permission to manage Careers vacancies.
        </p>
      ) : (
        <CareersAdmin canReviewApplications={admin.role === 'OWNER' || admin.role === 'ADMIN'} />
      )}
    </AdminShell>
  );
}
