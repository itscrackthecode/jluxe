# JLUXE Frontend

Next.js + TypeScript + Tailwind CSS starter for the JLUXE website.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture

- `src/app` — routes and global styles
- `src/components` — reusable interactive UI
- `src/lib/data.ts` — temporary mock content

The mock data is intentionally separate from components so it can later be replaced by the JLUXE API without redesigning the UI.

## PostgreSQL SQL migrations

The SQL migrations live in `database/migrations`. To initialize a new local database:

1. Create an empty PostgreSQL database using pgAdmin or your local PostgreSQL tools.
2. Set `DATABASE_URL` in `.env.local` to that local database. Keep credentials out of source control.
3. Run:

```bash
npm run db:sql:migrate
```

Check migration state without changing the database:

```bash
npm run db:sql:migrate:status
```

The runner applies numbered SQL files in order. It records each filename, SHA-256 checksum, and applied timestamp in `schema_migrations`. Each migration and its history insert run in one transaction. Applied files are immutable: a changed checksum or a tracked migration without a matching file stops the runner. A failed migration is rolled back and stops processing. The status command does not create the tracking table.

### Existing production database baseline

The production database already has the schema represented by `001_initial.sql`. Do **not** run `npm run db:sql:migrate` against it before baselining; that would try to create the existing schema again.

Before baselining, verify through pgAdmin that all tables, enum types, columns, defaults, indexes, foreign keys, and check constraints match `001_initial.sql`. Then, during an explicitly approved production operation, record the initial migration without executing its SQL:

```bash
npm run db:sql:migrate:baseline -- 001_initial.sql --confirm-schema --allow-remote
```

Baseline creates `schema_migrations` if necessary and records the filename/checksum in a transaction. It does not execute `001_initial.sql`. Do not run this command until the live schema has been independently verified. Afterward, future SQL migrations can be applied with `npm run db:sql:migrate` (remote writes require the explicit `--allow-remote` option). No production baseline has been run as part of this change.
