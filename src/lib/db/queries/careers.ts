import 'server-only';

import { pool, withTransaction } from '../pool';
import type { CareerApplicationStatus, CareerJob, CareerJobInput, CareerJobStatus } from '@/lib/career-types';

type CareerJobRow = Omit<CareerJob, 'experienceMinYears' | 'experienceMaxYears'> & {
  experienceMinYears: number;
  experienceMaxYears: number;
};

const careerJobColumns = `
  j."id", j."slug", j."title", j."department", j."serviceArea", j."openings",
  j."experienceMinYears"::float8 AS "experienceMinYears",
  j."experienceMaxYears"::float8 AS "experienceMaxYears",
  j."employmentType", j."location", j."workArrangement", j."salaryRange",
  TO_CHAR(j."deadline", 'YYYY-MM-DD') AS "deadline", j."summary", j."description",
  j."responsibilities", j."qualifications", j."status",
  TO_CHAR(j."publishedAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "publishedAt",
  TO_CHAR(j."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
  TO_CHAR(j."updatedAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"`;

export async function listPublicCareerJobs(search?: string): Promise<CareerJob[]> {
  const normalizedSearch = search?.trim().replace(/[\\%_]/g, '\\$&');
  const result = await pool.query<CareerJobRow>(
    `SELECT ${careerJobColumns}
     FROM public."CareerJob" j
     WHERE j."status" = 'PUBLISHED'
       AND (j."deadline" IS NULL OR j."deadline" >= CURRENT_DATE)
       AND ($1::text IS NULL OR j."title" ILIKE $1 ESCAPE E'\\\\'
         OR j."department" ILIKE $1 ESCAPE E'\\\\' OR j."summary" ILIKE $1 ESCAPE E'\\\\')
     ORDER BY j."publishedAt" DESC NULLS LAST, j."createdAt" DESC, j."id" DESC`,
    [normalizedSearch ? `%${normalizedSearch}%` : null],
  );
  return result.rows;
}

export async function findPublicCareerJobBySlug(slug: string): Promise<CareerJob | null> {
  const result = await pool.query<CareerJobRow>(
    `SELECT ${careerJobColumns} FROM public."CareerJob" j
     WHERE j."slug" = $1 AND j."status" = 'PUBLISHED'
       AND (j."deadline" IS NULL OR j."deadline" >= CURRENT_DATE)
     LIMIT 1`,
    [slug],
  );
  return result.rows[0] ?? null;
}

export async function listAdminCareerJobs(search?: string, status?: CareerJobStatus) {
  const normalizedSearch = search?.trim().replace(/[\\%_]/g, '\\$&');
  const result = await pool.query<CareerJobRow & { applicationCount: number }>(
    `SELECT ${careerJobColumns}, COUNT(a."id")::integer AS "applicationCount"
     FROM public."CareerJob" j
     LEFT JOIN public."CareerApplication" a ON a."jobId" = j."id"
     WHERE ($1::text IS NULL OR j."status" = $1)
       AND ($2::text IS NULL OR j."title" ILIKE $2 ESCAPE E'\\\\'
         OR j."department" ILIKE $2 ESCAPE E'\\\\' OR j."summary" ILIKE $2 ESCAPE E'\\\\')
     GROUP BY j."id"
     ORDER BY j."updatedAt" DESC, j."id" DESC`,
    [status ?? null, normalizedSearch ? `%${normalizedSearch}%` : null],
  );
  return result.rows;
}

export async function getAdminCareerJob(id: string): Promise<CareerJob | null> {
  const result = await pool.query<CareerJobRow>(
    `SELECT ${careerJobColumns} FROM public."CareerJob" j WHERE j."id" = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

const careerJobValues = (input: CareerJobInput) => [
  input.slug, input.title, input.department, input.serviceArea, input.openings, input.experienceMinYears,
  input.experienceMaxYears, input.employmentType, input.location, input.workArrangement,
  input.salaryRange, input.deadline, input.summary, input.description,
  input.responsibilities, input.qualifications, input.status,
];

export async function createAdminCareerJob(input: CareerJobInput, adminId: string) {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO public."CareerJob" (
       "slug", "title", "department", "serviceArea", "openings", "experienceMinYears", "experienceMaxYears",
       "employmentType", "location", "workArrangement", "salaryRange", "deadline", "summary",
       "description", "responsibilities", "qualifications", "status", "publishedAt",
       "createdByAdminId", "updatedByAdminId", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::varchar(16),
       CASE WHEN $17::varchar(16) = 'PUBLISHED' THEN NOW() ELSE NULL END, $18, $18, NOW())
     RETURNING "id"`,
    [...careerJobValues(input), adminId],
  );
  return getAdminCareerJob(result.rows[0].id);
}

export async function updateAdminCareerJob(id: string, input: CareerJobInput, adminId: string) {
  const result = await pool.query<{ id: string }>(
    `UPDATE public."CareerJob" SET
       "slug"=$1, "title"=$2, "department"=$3, "serviceArea"=$4, "openings"=$5,
       "experienceMinYears"=$6, "experienceMaxYears"=$7, "employmentType"=$8,
       "location"=$9, "workArrangement"=$10, "salaryRange"=$11, "deadline"=$12,
       "summary"=$13, "description"=$14, "responsibilities"=$15, "qualifications"=$16,
       "status"=$17::varchar(16),
       "publishedAt"=CASE WHEN $17::varchar(16) = 'PUBLISHED' AND "publishedAt" IS NULL THEN NOW()
                          WHEN $17::varchar(16) <> 'PUBLISHED' THEN NULL ELSE "publishedAt" END,
       "updatedByAdminId"=$18, "updatedAt"=NOW()
     WHERE "id"=$19 RETURNING "id"`,
    [...careerJobValues(input), adminId, id],
  );
  return result.rows[0] ? getAdminCareerJob(result.rows[0].id) : null;
}

export async function getCareerDashboardCounts() {
  const result = await pool.query<{ publishedJobs: number; totalApplications: number; newApplications: number }>(
    `SELECT
       (SELECT COUNT(*)::integer FROM public."CareerJob" WHERE "status"='PUBLISHED' AND ("deadline" IS NULL OR "deadline">=CURRENT_DATE)) AS "publishedJobs",
       COUNT(*)::integer AS "totalApplications",
       COUNT(*) FILTER (WHERE a."status"='NEW')::integer AS "newApplications"
     FROM public."CareerApplication" a`,
  );
  return result.rows[0];
}

export type CareerApplicationListItem = {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  city: string;
  experience: string;
  status: CareerApplicationStatus;
  jobId: string;
  jobTitle: string;
  jobSlug: string;
  createdAt: string;
};

export async function listCareerApplications(filters: {
  search?: string;
  jobId?: string;
  status?: CareerApplicationStatus;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}) {
  const values: unknown[] = [];
  const conditions: string[] = [];
  const add = (value: unknown) => `$${values.push(value)}`;
  const search = filters.search?.trim().replace(/[\\%_]/g, '\\$&');
  if (search) {
    const parameter = add(`%${search}%`);
    conditions.push(`(a."applicantName" ILIKE ${parameter} ESCAPE E'\\\\' OR a."email" ILIKE ${parameter} ESCAPE E'\\\\' OR j."title" ILIKE ${parameter} ESCAPE E'\\\\')`);
  }
  if (filters.jobId) conditions.push(`a."jobId" = ${add(filters.jobId)}::uuid`);
  if (filters.status) conditions.push(`a."status" = ${add(filters.status)}`);
  if (filters.from) conditions.push(`a."createdAt" >= ${add(filters.from)}::date`);
  if (filters.to) conditions.push(`a."createdAt" < (${add(filters.to)}::date + INTERVAL '1 day')`);
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = add(filters.limit);
  const offset = add(filters.offset);
  const result = await pool.query<CareerApplicationListItem>(
    `SELECT a."id", a."applicantName", a."email", a."phone", a."city", a."experience",
            a."status", a."jobId", j."title" AS "jobTitle", j."slug" AS "jobSlug",
            TO_CHAR(a."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt"
     FROM public."CareerApplication" a JOIN public."CareerJob" j ON j."id"=a."jobId"
     ${where} ORDER BY a."createdAt" DESC, a."id" DESC LIMIT ${limit} OFFSET ${offset}`,
    values,
  );
  const count = await pool.query<{ total: number }>(
    `SELECT COUNT(*)::integer AS "total" FROM public."CareerApplication" a
     JOIN public."CareerJob" j ON j."id"=a."jobId" ${where}`,
    values.slice(0, -2),
  );
  return { data: result.rows, total: count.rows[0]?.total ?? 0 };
}

export async function findCareerApplicationByIdempotencyKey(idempotencyKey: string) {
  const result = await pool.query<{ id: string }>(
    `SELECT "id" FROM public."CareerApplication" WHERE "idempotencyKey"=$1 LIMIT 1`,
    [idempotencyKey],
  );
  return result.rows[0] ?? null;
}

export async function createCareerApplication(input: {
  jobSlug: string;
  applicantName: string;
  email: string;
  phone: string;
  city: string;
  highestQualification: string;
  experience: string;
  skills: string;
  resumeStorageKey: string;
  resumeFileName: string;
  resumeByteSize: number;
  consentVersion: string;
  idempotencyKey: string;
}) {
  return withTransaction(async (client) => {
    const job = await client.query<{ id: string }>(
      `SELECT "id" FROM public."CareerJob" WHERE "slug"=$1 AND "status"='PUBLISHED'
       AND ("deadline" IS NULL OR "deadline">=CURRENT_DATE) FOR SHARE`,
      [input.jobSlug],
    );
    if (!job.rows[0]) return 'closed' as const;
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO public."CareerApplication" (
         "jobId", "applicantName", "email", "phone", "city", "highestQualification", "experience", "skills",
         "resumeStorageKey", "resumeFileName", "resumeByteSize", "consentedAt", "consentVersion", "idempotencyKey"
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),$12,$13)
       ON CONFLICT ("idempotencyKey") DO NOTHING RETURNING "id"`,
      [job.rows[0].id, input.applicantName, input.email, input.phone, input.city,
        input.highestQualification, input.experience, input.skills, input.resumeStorageKey,
        input.resumeFileName, input.resumeByteSize, input.consentVersion, input.idempotencyKey],
    );
    if (!inserted.rows[0]) return 'duplicate' as const;
    await client.query(
      `INSERT INTO public."CareerApplicationStatusHistory" ("applicationId", "newStatus") VALUES ($1,'NEW')`,
      [inserted.rows[0].id],
    );
    return 'created' as const;
  });
}

export async function getCareerApplication(id: string) {
  const result = await pool.query<{
    id: string; jobId: string; jobTitle: string; jobSlug: string; applicantName: string;
    email: string; phone: string; city: string; highestQualification: string; experience: string;
    skills: string; resumeStorageKey: string; resumeFileName: string; resumeByteSize: number;
    consentedAt: string; consentVersion: string; status: CareerApplicationStatus; internalNotes: string;
    createdAt: string; updatedAt: string;
  }>(
    `SELECT a."id", a."jobId", j."title" AS "jobTitle", j."slug" AS "jobSlug", a."applicantName", a."email", a."phone", a."city",
            a."highestQualification", a."experience", a."skills", a."resumeStorageKey", a."resumeFileName", a."resumeByteSize",
            TO_CHAR(a."consentedAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "consentedAt",
            a."consentVersion", a."status", a."internalNotes",
            TO_CHAR(a."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
            TO_CHAR(a."updatedAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "updatedAt"
     FROM public."CareerApplication" a JOIN public."CareerJob" j ON j."id"=a."jobId"
     WHERE a."id"=$1 LIMIT 1`,
    [id],
  );
  const application = result.rows[0];
  if (!application) return null;
  const history = await pool.query<{
    previousStatus: CareerApplicationStatus | null; newStatus: CareerApplicationStatus;
    internalNote: string | null; createdAt: string; changedBy: string | null;
  }>(
    `SELECT h."previousStatus", h."newStatus", h."internalNote",
            TO_CHAR(h."createdAt" AT TIME ZONE current_setting('TimeZone'), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
            ad."displayName" AS "changedBy"
     FROM public."CareerApplicationStatusHistory" h LEFT JOIN public."Admin" ad ON ad."id"=h."changedByAdminId"
     WHERE h."applicationId"=$1 ORDER BY h."createdAt" DESC, h."id" DESC`,
    [id],
  );
  return { ...application, history: history.rows };
}

export async function updateCareerApplication(id: string, input: {
  status: CareerApplicationStatus;
  internalNotes: string;
}, adminId: string) {
  return withTransaction(async (client) => {
    const existing = await client.query<{ status: CareerApplicationStatus }>(
      `SELECT "status" FROM public."CareerApplication" WHERE "id"=$1 FOR UPDATE`, [id],
    );
    if (!existing.rows[0]) return false;
    await client.query(
      `UPDATE public."CareerApplication" SET "status"=$2, "internalNotes"=$3,
         "updatedAt"=NOW(), "statusUpdatedAt"=CASE WHEN "status"<>$2 THEN NOW() ELSE "statusUpdatedAt" END
       WHERE "id"=$1`,
      [id, input.status, input.internalNotes],
    );
    if (existing.rows[0].status !== input.status) {
      await client.query(
        `INSERT INTO public."CareerApplicationStatusHistory" ("applicationId", "previousStatus", "newStatus", "changedByAdminId")
         VALUES ($1,$2,$3,$4)`,
        [id, existing.rows[0].status, input.status, adminId],
      );
    }
    return true;
  });
}

export async function deleteCareerApplication(id: string) {
  const result = await pool.query<{ resumeStorageKey: string }>(
    `DELETE FROM public."CareerApplication" WHERE "id"=$1 RETURNING "resumeStorageKey"`, [id],
  );
  return result.rows[0] ?? null;
}

export async function listExpiredCareerApplications(retentionDays: number) {
  const result = await pool.query<{ id: string; resumeStorageKey: string }>(
    `SELECT "id", "resumeStorageKey" FROM public."CareerApplication"
     WHERE "createdAt" < NOW() - ($1 * INTERVAL '1 day')
     ORDER BY "createdAt" ASC LIMIT 50`,
    [retentionDays],
  );
  return result.rows;
}

export async function deleteCareerApplicationIfExpired(id: string, retentionDays: number) {
  const result = await pool.query(
    `DELETE FROM public."CareerApplication" WHERE "id"=$1
     AND "createdAt" < NOW() - ($2 * INTERVAL '1 day')`,
    [id, retentionDays],
  );
  return Boolean(result.rowCount);
}
