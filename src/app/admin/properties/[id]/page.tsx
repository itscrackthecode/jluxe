import { notFound, redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import PropertyForm from '@/components/admin/property-form';
import { getAdminSession } from '@/lib/admin-session';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Edit Property | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function EditAdminPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) notFound();

  return (
    <AdminShell admin={admin} active="Properties">
      <PropertyForm property={{
        ...property,
        priceAmount: property.priceAmount?.toString() ?? null,
        plotSize: property.plotSize?.toString() ?? null,
      }} />
    </AdminShell>
  );
}