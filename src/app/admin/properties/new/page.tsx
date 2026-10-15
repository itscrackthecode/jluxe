import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import PropertyForm from '@/components/admin/property-form';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = {
  title: { absolute: 'Add Property | JLUXE Admin' },
  robots: { index: false, follow: false },
};

export default async function NewAdminPropertyPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <AdminShell admin={admin} active="Properties">
      <PropertyForm />
    </AdminShell>
  );
}