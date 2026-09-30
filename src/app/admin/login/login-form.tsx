'use client';

import { useActionState } from 'react';
import { loginAdminAction, type AdminLoginState } from '../actions';

const initialState: AdminLoginState = { error: null };

export default function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          maxLength={320}
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--viridian-950)]">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          maxLength={128}
          required
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--viridian-950)] outline-none focus:border-[var(--gold)]"
        />
      </label>
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--viridian-900)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--viridian-800)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}