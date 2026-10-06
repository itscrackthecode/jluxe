import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import PortfolioList from '@/components/admin/portfolio-list';
import { getAdminSession } from '@/lib/admin-session';
import { listPortfolioServiceOptions } from '@/lib/db/queries/portfolio';

export const metadata = {
  title: { absolute: 'Our Work | JLUXE Admin' },
  robots: { index: false, follow: false },
};

export default async function AdminPortfolioPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  const services = await listPortfolioServiceOptions();

  return (
    <AdminShell admin={admin} active="Our Work">
      <PortfolioList services={services} />
    </AdminShell>
  );
}
