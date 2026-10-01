import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import ServiceList from '@/components/admin/service-list';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = {
  title: 'Services | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function AdminServicesPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <AdminShell admin={admin} active="Services">
      <ServiceList />
    </AdminShell>
  );
}