import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import EnquiryDetail from '@/components/admin/enquiry-detail';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = {
  title: { absolute: 'Enquiry Details | JLUXE Admin' },
  robots: { index: false, follow: false },
};

export default async function AdminEnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  const { id } = await params;
  return (
    <AdminShell admin={admin} active="Enquiries">
      <EnquiryDetail id={id} />
    </AdminShell>
  );
}