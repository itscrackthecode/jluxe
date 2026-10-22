import type { CareerJobInput } from '@/lib/career-types';

export const careerJobSaveValues = (input: CareerJobInput) => [
  input.slug, input.title, input.department, input.openings, input.experienceMinYears,
  input.experienceMaxYears, input.employmentType, input.location, input.workArrangement,
  input.salaryRange, input.deadline, input.summary, input.description,
  input.responsibilities, input.qualifications, input.status,
];

export const createCareerJobSql = `
  INSERT INTO public."CareerJob" (
    "slug", "title", "department", "openings", "experienceMinYears", "experienceMaxYears",
    "employmentType", "location", "workArrangement", "salaryRange", "deadline", "summary",
    "description", "responsibilities", "qualifications", "status", "publishedAt",
    "createdByAdminId", "updatedByAdminId", "updatedAt"
  ) VALUES (
    $1::varchar(160), $2::varchar(180), $3::varchar(120), $4::smallint,
    $5::numeric(4,1), $6::numeric(4,1), $7::varchar(32), $8::varchar(180),
    $9::varchar(80), $10::varchar(120), $11::date, $12::varchar(1000), $13::text,
    $14::text[], $15::text[], $16::varchar(16),
    CASE WHEN $16::varchar(16) = 'PUBLISHED' THEN NOW() ELSE NULL END,
    $17::uuid, $17::uuid, NOW()
  )
  RETURNING "id"`;

export const updateCareerJobSql = `
  UPDATE public."CareerJob" SET
    "slug"=$1::varchar(160), "title"=$2::varchar(180), "department"=$3::varchar(120),
    "openings"=$4::smallint, "experienceMinYears"=$5::numeric(4,1),
    "experienceMaxYears"=$6::numeric(4,1), "employmentType"=$7::varchar(32),
    "location"=$8::varchar(180), "workArrangement"=$9::varchar(80), "salaryRange"=$10::varchar(120),
    "deadline"=$11::date, "summary"=$12::varchar(1000), "description"=$13::text,
    "responsibilities"=$14::text[], "qualifications"=$15::text[], "status"=$16::varchar(16),
    "publishedAt"=CASE WHEN $16::varchar(16) = 'PUBLISHED' AND "publishedAt" IS NULL THEN NOW()
                        WHEN $16::varchar(16) <> 'PUBLISHED' THEN NULL ELSE "publishedAt" END,
    "updatedByAdminId"=$17::uuid, "updatedAt"=NOW()
  WHERE "id"=$18::uuid
  RETURNING "id"`;
