import 'server-only';

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyAdminPassword } from './admin-password';

export { hashAdminPassword, verifyAdminPassword } from './admin-password';

const sessionCookieName = 'jluxe_admin_session';
const sessionDurationSeconds = 60 * 60 * 8;

const adminSessionSchema = z.object({
  adminId: z.string().uuid(),
  displayName: z.string().min(1).max(150),
  role: z.enum(['OWNER', 'ADMIN', 'EDITOR']),
  expiresAt: z.number().int(),
}).strict();

type AdminSession = z.infer<typeof adminSessionSchema>;

function getSessionEncryptionKey() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('ADMIN_SESSION_SECRET must contain at least 32 bytes.');
  }

  return createHash('sha256').update(secret, 'utf8').digest();
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/admin',
    maxAge,
  };
}

export async function createAdminSession(admin: Pick<AdminSession, 'adminId' | 'displayName' | 'role'>) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const session = adminSessionSchema.parse({ ...admin, expiresAt });
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getSessionEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final(),
  ]);
  const token = [iv, cipher.getAuthTag(), ciphertext]
    .map((part) => part.toString('base64url'))
    .join('.');

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, getCookieOptions(sessionDurationSeconds));
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  try {
    const [encodedIv, encodedTag, encodedCiphertext, extra] = token.split('.');
    if (!encodedIv || !encodedTag || !encodedCiphertext || extra !== undefined) return null;

    const iv = Buffer.from(encodedIv, 'base64url');
    const tag = Buffer.from(encodedTag, 'base64url');
    const ciphertext = Buffer.from(encodedCiphertext, 'base64url');
    if (iv.length !== 12 || tag.length !== 16 || ciphertext.length > 4096) return null;

    const decipher = createDecipheriv('aes-256-gcm', getSessionEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    const parsed = adminSessionSchema.safeParse(JSON.parse(plaintext));

    if (!parsed.success || parsed.data.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, '', getCookieOptions(0));
}