import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import AdminShell from '@/components/admin/admin-shell';
import PortfolioForm from '@/components/admin/portfolio-form';
import { getAdminSession } from '@/lib/admin-session';
import { findAdminPortfolioById, listPortfolioServiceOptions, listPortfolioWorkMedia } from '@/lib/db/queries/portfolio';

export const metadata = {
  title: 'Edit Work | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function EditAdminPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [work, services, media] = await Promise.all([
    findAdminPortfolioById(id),
    listPortfolioServiceOptions(),
    listPortfolioWorkMedia([id]),
  ]);
  if (!work) notFound();

  const coverMedia = media.find((item) => item.position === 0) ?? null;

  return (
    <AdminShell admin={admin} active="Our Work">
      <PortfolioForm
        work={work}
        services={services}
        cover={coverMedia ? { storageKey: coverMedia.storageKey, altText: coverMedia.altText } : null}
      />
    </AdminShell>
  );
}
