'use client';

import { useActionState } from 'react';
import { loginAdminAction, type AdminLoginState } from '../actions';

const initialState: AdminLoginState = { error: null };

export default function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#f5f1e8]">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          maxLength={320}
          required
          className="w-full rounded-xl border border-white/15 bg-[#09221c] px-4 py-3 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[#f5f1e8]">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          maxLength={128}
          required
          className="w-full rounded-xl border border-white/15 bg-[#09221c] px-4 py-3 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus:border-[var(--gold)]"
        />
      </label>
      {state.error && (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}