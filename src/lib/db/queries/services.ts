import { pool, withTransaction } from '../pool';
import type { PublicationStatus, Service, UUID } from '../types';

export type AdminService = Omit<Service, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type ServiceWrite = Pick<
  Service,
  'title' | 'slug' | 'description' | 'publicationStatus' | 'sortOrder'
>;

const serviceColumns = `
  "id", "title", "slug", "description", "publicationStatus", "sortOrder",
  TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR("updatedAt" AT TIME ZONE current_setting('TimeZone'),
    'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`;

export async function listAdminServices(filters: {
  search?: string;
  publicationStatus?: PublicationStatus;
  limit: number;
  offset: number;
}): Promise<{ data: AdminService[]; total: number }> {
  const escapedSearch = filters.search?.replace(/[\\%_]/g, '\\$&');
  const values = [
    escapedSearch ? `%${escapedSearch}%` : null,
    filters.publicationStatus ?? null,
  ];
  const conditions = `
    ($1::text IS NULL OR "title" ILIKE $1 ESCAPE E'\\\\' OR "slug" ILIKE $1 ESCAPE E'\\\\')
    AND ($2::"PublicationStatus" IS NULL OR "publicationStatus" = $2::"PublicationStatus")`;

  return withTransaction(async (client) => {
    const countResult = await client.query<{ total: string }>(
      `SELECT COUNT(*) AS "total" FROM "Service" WHERE ${conditions}`,
      values,
    );
    const rowsResult = await client.query<AdminService>(
      `SELECT ${serviceColumns} FROM "Service" WHERE ${conditions}
       ORDER BY "sortOrder" ASC, "title" ASC, "id" ASC
       LIMIT $3 OFFSET $4`,
      [...values, filters.limit, filters.offset],
    );

    return {
      data: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  });
}

export async function findAdminServiceById(id: UUID): Promise<AdminService | null> {
  const result = await pool.query<AdminService>(
    `SELECT ${serviceColumns} FROM "Service" WHERE "id" = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createAdminService(input: ServiceWrite): Promise<AdminService> {
  const result = await pool.query<AdminService>(
    `INSERT INTO "Service" (
       "title", "slug", "description", "publicationStatus", "sortOrder", "updatedAt"
     ) VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING ${serviceColumns}`,
    [input.title, input.slug, input.description, input.publicationStatus, input.sortOrder],
  );
  return result.rows[0];
}

export async function updateAdminService(
  id: UUID,
  input: ServiceWrite,
): Promise<AdminService | null> {
  const result = await pool.query<AdminService>(
    `UPDATE "Service" SET
       "title" = $2,
       "slug" = $3,
       "description" = $4,
       "publicationStatus" = $5,
       "sortOrder" = $6,
       "updatedAt" = NOW()
     WHERE "id" = $1
     RETURNING ${serviceColumns}`,
    [id, input.title, input.slug, input.description, input.publicationStatus, input.sortOrder],
  );
  return result.rows[0] ?? null;
}

export async function countServicePortfolioReferences(id: UUID): Promise<number> {
  const result = await pool.query<{ total: string }>('SELECT COUNT(*) AS "total" FROM "PortfolioWork" WHERE "serviceId" = $1', [id]);
  return Number(result.rows[0]?.total ?? 0);
}

export async function deleteAdminService(id: UUID): Promise<'deleted' | 'missing' | 'in-use'> {
  if (await countServicePortfolioReferences(id) > 0) return 'in-use';
  const result = await pool.query('DELETE FROM "Service" WHERE "id" = $1', [id]);
  return result.rowCount ? 'deleted' : 'missing';
}