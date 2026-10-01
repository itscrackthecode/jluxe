import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import AdminShell from '@/components/admin/admin-shell';
import ServiceForm from '@/components/admin/service-form';
import { getAdminSession } from '@/lib/admin-session';
import { findAdminServiceById } from '@/lib/db/queries/services';

export const metadata = {
  title: 'Edit Service | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function EditAdminServicePage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const service = await findAdminServiceById(id);
  if (!service) notFound();

  return (
    <AdminShell admin={admin} active="Services">
      <ServiceForm service={service} />
    </AdminShell>
  );
}