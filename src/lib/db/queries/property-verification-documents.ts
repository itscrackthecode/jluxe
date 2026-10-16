import { pool } from '../pool';
import type { UUID } from '../types';

export type PropertyVerificationDocument = {
  id: UUID;
  propertyId: UUID;
  fileName: string;
  mimeType: 'application/pdf' | 'application/msword';
  byteSize: number;
  createdAt: string;
};

export async function listPropertyVerificationDocuments(propertyId: UUID) {
  const result = await pool.query<PropertyVerificationDocument>(
    `SELECT "id", "propertyId", "fileName", "mimeType", "byteSize",
            TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
     FROM public."PropertyVerificationDocument"
     WHERE "propertyId" = $1
     ORDER BY "createdAt" DESC, "id" DESC`,
    [propertyId],
  );
  return result.rows;
}

export async function createPropertyVerificationDocument(input: {
  propertyId: UUID;
  fileName: string;
  mimeType: 'application/pdf' | 'application/msword';
  content: Buffer;
  adminId: UUID;
}) {
  const result = await pool.query<PropertyVerificationDocument>(
    `INSERT INTO public."PropertyVerificationDocument"
       ("propertyId", "fileName", "mimeType", "byteSize", "content", "uploadedByAdminId")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING "id", "propertyId", "fileName", "mimeType", "byteSize",
       TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
         'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"`,
    [input.propertyId, input.fileName, input.mimeType, input.content.byteLength, input.content, input.adminId],
  );
  return result.rows[0];
}

export async function findPropertyVerificationDocument(id: UUID, propertyId: UUID) {
  const result = await pool.query<PropertyVerificationDocument & { content: Buffer }>(
    `SELECT "id", "propertyId", "fileName", "mimeType", "byteSize", "content",
            TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'),
              'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
     FROM public."PropertyVerificationDocument"
     WHERE "id" = $1 AND "propertyId" = $2
     LIMIT 1`,
    [id, propertyId],
  );
  return result.rows[0] ?? null;
}

export async function deletePropertyVerificationDocument(id: UUID, propertyId: UUID) {
  const result = await pool.query(
    'DELETE FROM public."PropertyVerificationDocument" WHERE "id" = $1 AND "propertyId" = $2',
    [id, propertyId],
  );
  return Boolean(result.rowCount);
}
