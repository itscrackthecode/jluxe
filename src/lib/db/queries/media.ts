import { pool } from '../pool';
import type { Media, UUID } from '../types';

export type AdminMedia = Omit<Media, 'byteSize' | 'createdAt'> & {
  byteSize: string;
  createdAt: string;
  propertyReferences: number;
  portfolioReferences: number;
};

export async function listAdminMedia(filters: {
  search?: string;
  mimeType?: string;
  limit: number;
  offset: number;
}): Promise<{ data: AdminMedia[]; total: number }> {
  const search = filters.search ? `%${filters.search.replace(/[\\%_]/g, '\\$&')}%` : null;
  const mimeType = filters.mimeType || null;
  const where = `($1::text IS NULL OR "storageKey" ILIKE $1 ESCAPE E'\\\\') AND ($2::text IS NULL OR "mimeType" = $2)`;
  const values = [search, mimeType];
  const [count, rows] = await Promise.all([
    pool.query<{ total: string }>(`SELECT COUNT(*) AS "total" FROM "Media" WHERE ${where}`, values),
    pool.query<AdminMedia>(
      `SELECT m."id", m."storageKey", m."provider", m."mimeType", m."byteSize", m."width", m."height", m."uploadedByAdminId",
              TO_CHAR(m."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
              COUNT(DISTINCT pm."propertyId")::int AS "propertyReferences",
              COUNT(DISTINCT pwm."portfolioWorkId")::int AS "portfolioReferences"
       FROM "Media" m
       LEFT JOIN "PropertyMedia" pm ON pm."mediaId" = m."id"
       LEFT JOIN "PortfolioWorkMedia" pwm ON pwm."mediaId" = m."id"
       WHERE ${where}
       GROUP BY m."id"
       ORDER BY m."createdAt" DESC, m."id" DESC
       LIMIT $3 OFFSET $4`,
      [...values, filters.limit, filters.offset],
    ),
  ]);
  return { data: rows.rows, total: Number(count.rows[0]?.total ?? 0) };
}

export async function deleteMediaIfUnused(id: UUID): Promise<'deleted' | 'missing' | 'in-use'> {
  const usage = await pool.query<{ references: string }>(
    `SELECT (SELECT COUNT(*) FROM "PropertyMedia" WHERE "mediaId" = $1) +
            (SELECT COUNT(*) FROM "PortfolioWorkMedia" WHERE "mediaId" = $1) AS "references"`,
    [id],
  );
  if (Number(usage.rows[0]?.references ?? 0) > 0) return 'in-use';
  const result = await pool.query('DELETE FROM "Media" WHERE "id" = $1', [id]);
  return result.rowCount ? 'deleted' : 'missing';
}
