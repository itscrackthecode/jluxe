import { pool } from '../pool';

export async function getAdminDashboardCounts() {
  const result = await pool.query<{ properties: string; portfolio: string; enquiries: string; careers: string }>(
    `SELECT
       (SELECT COUNT(*) FROM "Property") AS "properties",
       (SELECT COUNT(*) FROM "PortfolioWork") AS "portfolio",
       (SELECT COUNT(*) FROM public."CareerJob") AS "careers",
       (SELECT COUNT(*) FROM "Enquiry") AS "enquiries"`,
  );
  const row = result.rows[0];
  return {
    properties: Number(row?.properties ?? 0),
    portfolio: Number(row?.portfolio ?? 0),
    careers: Number(row?.careers ?? 0),
    enquiries: Number(row?.enquiries ?? 0),
  };
}
