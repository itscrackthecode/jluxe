import { pool, withTransaction } from '../pool';
import { cloudinaryDeliveryUrl } from '@/lib/cloudinary';
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
  return { data: rows.rows.map((item) => ({ ...item, deliveryUrl: item.provider === 'cloudinary' ? cloudinaryDeliveryUrl(item.storageKey) : item.storageKey.startsWith('/') ? item.storageKey : null })), total: Number(count.rows[0]?.total ?? 0) };
}

export async function createCloudinaryMedia(input: { storageKey: string; mimeType: string; byteSize: number; width: number; height: number; adminId: UUID | null }) {
  const result = await pool.query<Media>(
    `INSERT INTO "Media" ("storageKey", "provider", "mimeType", "byteSize", "width", "height", "uploadedByAdminId")
     VALUES ($1, 'cloudinary', $2, $3, $4, $5, $6)
     RETURNING "id", "storageKey", "provider", "mimeType", "byteSize", "width", "height", "uploadedByAdminId", "createdAt"`,
    [input.storageKey, input.mimeType, input.byteSize, input.width, input.height, input.adminId],
  );
  return result.rows[0];
}

export async function deleteMediaIfUnused(id: UUID, deleteCloudAsset?: (storageKey: string) => Promise<void>): Promise<'deleted' | 'missing' | 'in-use'> {
  return withTransaction(async (client) => {
    const media = await client.query<{ storageKey: string; provider: string }>(
      'SELECT "storageKey", "provider" FROM "Media" WHERE "id" = $1 FOR UPDATE', [id],
    );
    if (!media.rows[0]) return 'missing';
    const usage = await client.query<{ references: string }>(
      `SELECT (SELECT COUNT(*) FROM "PropertyMedia" WHERE "mediaId" = $1) +
              (SELECT COUNT(*) FROM "PortfolioWorkMedia" WHERE "mediaId" = $1) AS "references"`, [id],
    );
    if (Number(usage.rows[0]?.references ?? 0) > 0) return 'in-use';
    if (media.rows[0].provider === 'cloudinary') {
      if (!deleteCloudAsset) throw new Error('Cloudinary deletion is unavailable.');
      await deleteCloudAsset(media.rows[0].storageKey);
    }
    await client.query('DELETE FROM "Media" WHERE "id" = $1', [id]);
    return 'deleted';
  });
}
