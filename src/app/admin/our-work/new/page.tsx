import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import PortfolioForm from '@/components/admin/portfolio-form';
import { getAdminSession } from '@/lib/admin-session';
import { listPortfolioServiceOptions, listServiceCategories } from '@/lib/db/queries/portfolio';

export const metadata = {
  title: { absolute: 'Add Work | JLUXE Admin' },
  robots: { index: false, follow: false },
};

export default async function NewAdminPortfolioPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  const [services, categories] = await Promise.all([listPortfolioServiceOptions(), listServiceCategories()]);

  return (
    <AdminShell admin={admin} active="Our Work">
      <PortfolioForm services={services} categories={categories} />
    </AdminShell>
  );
}
