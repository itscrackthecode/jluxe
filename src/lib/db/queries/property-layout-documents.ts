import { pool } from '../pool';
import type { UUID } from '../types';

export type PropertyLayoutDocument = { id: UUID; propertyId: UUID; fileName: string; mimeType: string; byteSize: number; createdAt: string };

export async function listPropertyLayoutDocuments(propertyId: UUID) {
  const result = await pool.query<PropertyLayoutDocument>(
    `SELECT "id", "propertyId", "fileName", "mimeType", "byteSize",
       TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
     FROM public."PropertyLayoutDocument" WHERE "propertyId" = $1 ORDER BY "createdAt" DESC, "id" DESC`, [propertyId]);
  return result.rows;
}

export async function createPropertyLayoutDocument(input: { propertyId: UUID; fileName: string; mimeType: string; content: Buffer; adminId: UUID }) {
  const result = await pool.query<PropertyLayoutDocument>(
    `INSERT INTO public."PropertyLayoutDocument" ("propertyId", "fileName", "mimeType", "byteSize", "content", "uploadedByAdminId")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING "id", "propertyId", "fileName", "mimeType", "byteSize",
       TO_CHAR("createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"`,
    [input.propertyId, input.fileName, input.mimeType, input.content.byteLength, input.content, input.adminId]);
  return result.rows[0];
}

export async function findPropertyLayoutDocument(id: UUID, propertyId: UUID) {
  const result = await pool.query<PropertyLayoutDocument & { content: Buffer }>(
    `SELECT "id", "propertyId", "fileName", "mimeType", "byteSize", "content"
     FROM public."PropertyLayoutDocument" WHERE "id" = $1 AND "propertyId" = $2 LIMIT 1`, [id, propertyId]);
  return result.rows[0] ?? null;
}

export async function deletePropertyLayoutDocument(id: UUID, propertyId: UUID) {
  const result = await pool.query('DELETE FROM public."PropertyLayoutDocument" WHERE "id" = $1 AND "propertyId" = $2', [id, propertyId]);
  return Boolean(result.rowCount);
}
