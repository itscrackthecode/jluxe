import 'server-only';

import { Pool, type PoolClient } from 'pg';

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set to connect to PostgreSQL.');
  }

  return new Pool({ connectionString });
}

export const pool = globalForPostgres.postgresPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.postgresPool = pool;
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original operation error.
    }
    throw error;
  } finally {
    client.release();
  }
}