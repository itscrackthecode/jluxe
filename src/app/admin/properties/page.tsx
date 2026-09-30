import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import PropertyList from '@/components/admin/property-list';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = {
  title: 'Properties | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function AdminPropertiesPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <AdminShell admin={admin} active="Properties">
      <PropertyList />
    </AdminShell>
  );
}