import { pool } from '../pool';
import type { Admin, AdminRole } from '../types';

export type AdminForAuthentication = Pick<
  Admin,
  'id' | 'email' | 'displayName' | 'role' | 'isActive' | 'passwordHash'
>;

export type CreatedAdmin = Pick<Admin, 'id' | 'email' | 'displayName' | 'role'>;

export async function findAdminByEmail(email: string): Promise<AdminForAuthentication | null> {
  const result = await pool.query<AdminForAuthentication>(
    `SELECT "id", "email", "displayName", "role", "isActive", "passwordHash"
     FROM "Admin" WHERE "email" = $1 LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function createAdmin(input: {
  email: string;
  displayName: string;
  role: AdminRole;
  passwordHash: string;
}): Promise<CreatedAdmin> {
  const result = await pool.query<CreatedAdmin>(
    `INSERT INTO "Admin" ("email", "displayName", "role", "passwordHash", "updatedAt")
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING "id", "email", "displayName", "role"`,
    [input.email, input.displayName, input.role, input.passwordHash],
  );
  return result.rows[0];
}

export async function findActiveAdminById(id: string): Promise<Pick<Admin, 'id' | 'displayName' | 'role'> | null> {
  const result = await pool.query<Pick<Admin, 'id' | 'displayName' | 'role'>>(
    `SELECT "id", "displayName", "role"
     FROM "Admin" WHERE "id" = $1 AND "isActive" = TRUE LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}
