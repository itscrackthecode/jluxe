import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import ServiceForm from '@/components/admin/service-form';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = {
  title: 'Add Service | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function NewAdminServicePage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <AdminShell admin={admin} active="Services">
      <ServiceForm />
    </AdminShell>
  );
}