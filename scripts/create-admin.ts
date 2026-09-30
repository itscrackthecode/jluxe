import { createInterface } from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { loadEnvConfig } from '@next/env';
import { z } from 'zod';
import { AdminRole } from '../src/generated/prisma/enums';
import { hashAdminPassword } from '../src/lib/admin-password';

const roles = Object.values(AdminRole);
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
  const { prisma } = await import('../src/lib/prisma-client');

  try {
    const name = nameSchema.parse(await promptLine('Name'));
    const email = emailSchema.parse(await promptLine('Email')).toLowerCase();

    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingAdmin) {
      throw new Error('An Admin account with that email already exists.');
    }

    const password = passwordSchema.parse(await promptHidden('Password'));
    const confirmation = await promptHidden('Confirm password');
    if (password !== confirmation) {
      throw new Error('Passwords do not match.');
    }

    const roleInput = await promptRole();
    const role = (roleInput || 'ADMIN').toUpperCase();
    if (!roles.includes(role as typeof roles[number])) {
      throw new Error(`Role must be one of: ${roles.join(', ')}.`);
    }

    const passwordHash = await hashAdminPassword(password);
    const admin = await prisma.admin.create({
      data: {
        displayName: name,
        email,
        passwordHash,
        role: role as typeof AdminRole[keyof typeof AdminRole],
      },
      select: { id: true, email: true, displayName: true, role: true },
    });

    console.log(`Admin created: ${admin.displayName} (${admin.role}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Admin creation failed.');
  process.exitCode = 1;
});