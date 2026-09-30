import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/admin-shell';
import EnquiryList from '@/components/admin/enquiry-list';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = {
  title: 'Enquiries | JLUXE Admin',
  robots: { index: false, follow: false },
};

export default async function AdminEnquiriesPage() {
  const admin = await getAdminSession();
  if (!admin) redirect('/admin/login');

  return (
    <AdminShell admin={admin} active="Enquiries">
      <EnquiryList />
    </AdminShell>
  );
}