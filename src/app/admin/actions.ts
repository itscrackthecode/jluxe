'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { findAdminByEmail } from '@/lib/db/queries/admins';
import { clearAdminSession, createAdminSession, verifyAdminPassword } from '@/lib/admin-session';

const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export type AdminLoginState = { error: string | null };

export async function loginAdminAction(
  _previousState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) return { error: 'Invalid email or password.' };

  try {
    const admin = await findAdminByEmail(parsed.data.email.toLowerCase());

    const passwordMatches = await verifyAdminPassword(
      parsed.data.password,
      admin?.passwordHash ?? null,
    );

    if (!admin || !admin.isActive || !passwordMatches) {
      return { error: 'Invalid email or password.' };
    }

    await createAdminSession({
      adminId: admin.id,
      displayName: admin.displayName,
      role: admin.role,
    });
  } catch (error) {
    console.error('Admin sign-in could not be completed.', {
      errorName: error instanceof Error ? error.name : 'UnknownError',
    });
    return { error: 'Sign-in is temporarily unavailable. Please try again later.' };
  }

  redirect('/admin');
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect('/admin/login');
}