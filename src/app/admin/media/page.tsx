import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import MediaLibrary from '@/components/admin/media-library';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = { title: { absolute: 'Media | JLUXE Admin' }, robots: { index: false, follow: false } };

export default async function AdminMediaPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');
  return <AdminShell admin={admin} active="Media"><MediaLibrary /></AdminShell>;
}