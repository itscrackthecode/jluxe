import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { loadEnvConfig } from '@next/env';

type Migration = {
  name: string;
  sql: string;
  checksum: string;
};

type AppliedMigration = {
  migration_name: string;
  checksum: string;
  applied_at: Date;
};

const migrationDirectory = join(process.cwd(), 'database', 'migrations');
const migrationTable = 'public.schema_migrations';
const advisoryLockKey = 628194320;
const migrationNamePattern = /^\d{3,}_[a-z0-9_]+\.sql$/;

function checksum(sql: string) {
  return createHash('sha256')
    .update(sql.replace(/\r\n/g, '\n'), 'utf8')
    .digest('hex');
}

async function loadMigrations(): Promise<Migration[]> {
  const names = (await readdir(migrationDirectory))
    .filter((name) => name.endsWith('.sql'))
    .sort((first, second) => first.localeCompare(second, 'en'));

  const migrations: Migration[] = [];
  for (const name of names) {
    if (!migrationNamePattern.test(name)) {
      throw new Error(`Invalid migration filename: ${name}`);
    }

    const sql = await readFile(join(migrationDirectory, name), 'utf8');
    if (!sql.trim()) throw new Error(`Migration is empty: ${name}`);
    migrations.push({ name, sql, checksum: checksum(sql) });
  }

  return migrations;
}

async function ensureMigrationTable(client: import('pg').PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${migrationTable} (
      migration_name TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
    )
  `);
}

async function readAppliedMigrations(client: import('pg').PoolClient): Promise<AppliedMigration[]> {
  const result = await client.query<AppliedMigration>(
    `SELECT migration_name, checksum, applied_at
     FROM ${migrationTable}
     ORDER BY migration_name`,
  );
  return result.rows;
}

function validateHistory(migrations: Migration[], applied: AppliedMigration[]) {
  const migrationByName = new Map(migrations.map((migration) => [migration.name, migration]));
  const appliedByName = new Map(applied.map((record) => [record.migration_name, record]));

  for (const record of applied) {
    const migration = migrationByName.get(record.migration_name);
    if (!migration) {
      throw new Error(`Database tracks ${record.migration_name}, but its SQL file is missing.`);
    }
    if (migration.checksum !== record.checksum) {
      throw new Error(`Applied migration was modified: ${record.migration_name}`);
    }
  }

  return appliedByName;
}

async function withMigrationLock<T>(
  pool: typeof import('pg').Pool.prototype,
  operation: (client: import('pg').PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let locked = false;

  try {
    await client.query('SELECT pg_advisory_lock($1)', [advisoryLockKey]);
    locked = true;
    return await operation(client);
  } finally {
    try {
      if (locked) await client.query('SELECT pg_advisory_unlock($1)', [advisoryLockKey]);
    } finally {
      client.release();
    }
  }
}

async function runMigrations(pool: typeof import('pg').Pool.prototype, migrations: Migration[]) {
  await withMigrationLock(pool, async (client) => {
    await ensureMigrationTable(client);
    const applied = validateHistory(migrations, await readAppliedMigrations(client));

    for (const migration of migrations) {
      if (applied.has(migration.name)) {
        console.log(`Already applied: ${migration.name}`);
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          `INSERT INTO ${migrationTable} (migration_name, checksum)
           VALUES ($1, $2)`,
          [migration.name, migration.checksum],
        );
        await client.query('COMMIT');
        console.log(`Applied: ${migration.name}`);
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch {
          throw new Error(`Migration ${migration.name} failed and rollback also failed.`);
        }
        const detail = error instanceof Error ? error.message : 'Unknown database error.';
        throw new Error(`Migration ${migration.name} failed; its transaction was rolled back. ${detail}`);
      }
    }
  });
}

async function showStatus(pool: typeof import('pg').Pool.prototype, migrations: Migration[]) {
  const result = await pool.query<{ migration_table: string | null }>(
    'SELECT to_regclass($1) AS migration_table',
    [migrationTable],
  );

  if (!result.rows[0]?.migration_table) {
    for (const migration of migrations) console.log(`PENDING: ${migration.name}`);
    if (migrations.length === 0) console.log('No SQL migrations found.');
    return;
  }

  const appliedResult = await pool.query<AppliedMigration>(
    `SELECT migration_name, checksum, applied_at
     FROM ${migrationTable}
     ORDER BY migration_name`,
  );
  const applied = validateHistory(migrations, appliedResult.rows);
  for (const migration of migrations) {
    console.log(`${applied.has(migration.name) ? 'APPLIED' : 'PENDING'}: ${migration.name}`);
  }
  if (migrations.length === 0) console.log('No SQL migrations found.');
}

async function baselineMigration(
  pool: typeof import('pg').Pool.prototype,
  migrations: Migration[],
  name: string | undefined,
  confirmed: boolean,
) {
  if (!confirmed) {
    throw new Error('Baseline requires prior schema verification and --confirm-schema. No SQL was executed.');
  }
  if (!name) throw new Error('Specify the migration filename to baseline.');
  if (migrations[0]?.name !== name) {
    throw new Error('Only the first migration can be baselined on an existing database.');
  }

  await withMigrationLock(pool, async (client) => {
    await client.query('BEGIN');
    try {
      await ensureMigrationTable(client);
      const applied = await readAppliedMigrations(client);
      const existing = applied.find((record) => record.migration_name === name);

      if (existing) {
        if (existing.checksum !== migrations[0].checksum) {
          throw new Error(`Applied migration was modified: ${name}`);
        }
        if (applied.length !== 1) {
          throw new Error('Cannot baseline when other migrations are already tracked.');
        }
        await client.query('COMMIT');
        console.log(`Already baselined: ${name}; no migration SQL was executed.`);
        return;
      }
      if (applied.length > 0) {
        throw new Error('Cannot baseline while other migrations are tracked.');
      }

      await client.query(
        `INSERT INTO ${migrationTable} (migration_name, checksum)
         VALUES ($1, $2)`,
        [name, migrations[0].checksum],
      );
      await client.query('COMMIT');
      console.log(`Baselined: ${name}; no migration SQL was executed.`);
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        throw new Error('Baseline failed and its transaction could not be rolled back.');
      }
      throw error;
    }
  });
}

function requireRemoteApproval(approved: boolean) {
  const databaseUrl = new URL(process.env.DATABASE_URL!);
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname.toLowerCase());
  if (!isLocal && !approved) {
    throw new Error('Refusing a remote database write without --allow-remote.');
  }
}

async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set.');

  const [command = 'migrate', ...args] = process.argv.slice(2);
  const migrations = await loadMigrations();
  const { pool } = await import('../src/lib/db/pool');

  try {
    if (command === 'migrate') {
      if (args.some((arg) => arg !== '--allow-remote')) throw new Error('Unknown migrate option.');
      requireRemoteApproval(args.includes('--allow-remote'));
      await runMigrations(pool, migrations);
    } else if (command === 'status') {
      if (args.length > 0) throw new Error('The status command does not accept arguments.');
      await showStatus(pool, migrations);
    } else if (command === 'baseline') {
      const name = args.find((arg) => !arg.startsWith('--'));
      const confirmed = args.includes('--confirm-schema');
      const allowRemote = args.includes('--allow-remote');
      if (args.some((arg) => arg.startsWith('--') && arg !== '--confirm-schema' && arg !== '--allow-remote')) {
        throw new Error('Unknown baseline option.');
      }
      requireRemoteApproval(allowRemote);
      await baselineMigration(pool, migrations, name, confirmed);
    } else {
      throw new Error('Usage: migrate.ts [migrate|status|baseline <filename> --confirm-schema]');
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Migration command failed.');
  process.exitCode = 1;
});
