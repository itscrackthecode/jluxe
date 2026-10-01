import { createInterface } from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { loadEnvConfig } from '@next/env';
import { z } from 'zod';
import { hasPostgresErrorCode } from '../src/lib/db/errors';
import { adminRoles, type AdminRole } from '../src/lib/db/types';
import { hashAdminPassword } from '../src/lib/admin-password';

const roles = adminRoles;
const emailSchema = z.string().trim().email().max(320);
const nameSchema = z.string().trim().min(1).max(150);
const passwordSchema = z.string().min(12).max(128);

async function promptLine(label: string) {
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    return (await readline.question(`${label}: `)).trim();
  } finally {
    readline.close();
  }
}

function promptHidden(label: string) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('A TTY is required to securely enter the password.');
  }

  return new Promise<string>((resolve, reject) => {
    let value = '';
    const wasRaw = stdin.isRaw;
    emitKeypressEvents(stdin);
    stdout.write(`${label}: `);
    stdin.setRawMode(true);
    stdin.resume();

    const finish = (error?: Error) => {
      stdin.removeListener('keypress', onKeypress);
      stdin.setRawMode(wasRaw ?? false);
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onKeypress = (character: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === 'c') {
        finish(new Error('Cancelled.'));
      } else if (key.name === 'return' || key.name === 'enter') {
        finish();
      } else if (key.name === 'backspace') {
        value = value.slice(0, -1);
      } else if (!key.ctrl && character && character >= ' ') {
        value += character;
      }
    };

    stdin.on('keypress', onKeypress);
  });
}

function promptRole() {
  return promptLine(`Role (${roles.join(' / ')}) [ADMIN]`);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ createAdmin, findAdminByEmail }, { pool }] = await Promise.all([
    import('../src/lib/db/queries/admins'),
    import('../src/lib/db/pool'),
  ]);

  try {
    const name = nameSchema.parse(await promptLine('Name'));
    const email = emailSchema.parse(await promptLine('Email')).toLowerCase();

    const existingAdmin = await findAdminByEmail(email);
    if (existingAdmin) {
      throw new Error('An Admin account with that email already exists.');
    }

    const password = passwordSchema.parse(await promptHidden('Password'));
    const confirmation = await promptHidden('Confirm password');
    if (password !== confirmation) {
      throw new Error('Passwords do not match.');
    }

    const roleInput = await promptRole();
    const roleValue = (roleInput || 'ADMIN').toUpperCase();
    if (!roles.includes(roleValue as typeof roles[number])) {
      throw new Error(`Role must be one of: ${roles.join(', ')}.`);
    }
    const role = roleValue as AdminRole;

    const passwordHash = await hashAdminPassword(password);
    let admin;
    try {
      admin = await createAdmin({
        displayName: name,
        email,
        passwordHash,
        role,
      });
    } catch (error) {
      if (hasPostgresErrorCode(error, '23505')) {
        throw new Error('An Admin account with that email already exists.');
      }
      throw error;
    }

    console.log(`Admin created: ${admin.displayName} (${admin.role}).`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Admin creation failed.');
  process.exitCode = 1;
});