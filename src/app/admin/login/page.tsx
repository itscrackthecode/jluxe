import Link from 'next/link';
import { redirect } from 'next/navigation';
import AdminLoginForm from './login-form';
import { getAdminSession } from '@/lib/admin-session';

export const metadata = {
  title: { absolute: 'Admin Sign In | JLUXE' },
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect('/admin');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#061815] px-5 py-12 text-[#f5f1e8]">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#08201b] p-7 shadow-2xl sm:p-10">
        <Link href="/" className="font-display text-3xl font-semibold tracking-[0.12em] text-white">
          JLUXE
        </Link>
        <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PRIVATE ADMINISTRATION</p>
        <h1 className="mt-8 font-display text-3xl text-white">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-[#9caaa4]">Use your JLUXE administrator account to continue.</p>
        <AdminLoginForm />
        <Link
          href="/"
          className="mt-7 inline-flex min-h-10 items-center text-sm text-[#9caaa4] transition-colors hover:text-white"
        >
          Return to the public site
        </Link>
      </section>
    </main>
  );
}