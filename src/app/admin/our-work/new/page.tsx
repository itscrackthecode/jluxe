import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import PortfolioForm from '@/components/admin/portfolio-form';
import { getAdminSession } from '@/lib/admin-session';
import { listPortfolioServiceOptions } from '@/lib/db/queries/portfolio';

export const metadata = {
  title: 'Add Work | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function NewAdminPortfolioPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  const services = await listPortfolioServiceOptions();

  return (
    <AdminShell admin={admin} active="Our Work">
      <PortfolioForm services={services} />
    </AdminShell>
  );
}
