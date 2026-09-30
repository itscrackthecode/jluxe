import {
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';

const scryptOptions = { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const passwordHashPattern = /^scrypt\$32768\$8\$1\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/;
const dummySalt = Buffer.from('jluxe-admin-login-dummy-salt');

function derivePasswordKey(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, scryptOptions, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await derivePasswordKey(password, salt);

  return `scrypt$32768$8$1$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
}

export async function verifyAdminPassword(password: string, passwordHash: string | null) {
  if (!passwordHash || passwordHash.length > 255) {
    await derivePasswordKey(password, dummySalt);
    return false;
  }

  const match = passwordHashPattern.exec(passwordHash);
  if (!match) {
    await derivePasswordKey(password, dummySalt);
    return false;
  }

  const salt = Buffer.from(match[1], 'base64url');
  const expectedKey = Buffer.from(match[2], 'base64url');
  if (salt.length !== 16 || expectedKey.length !== 64) {
    await derivePasswordKey(password, dummySalt);
    return false;
  }

  const actualKey = await derivePasswordKey(password, salt);
  return timingSafeEqual(actualKey, expectedKey);
}