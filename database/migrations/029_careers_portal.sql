CREATE TABLE public."CareerJob" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" VARCHAR(160) NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "department" VARCHAR(120) NOT NULL,
  "openings" SMALLINT NOT NULL DEFAULT 1,
  "experienceMinYears" NUMERIC(4,1) NOT NULL DEFAULT 0,
  "experienceMaxYears" NUMERIC(4,1) NOT NULL DEFAULT 0,
  "employmentType" VARCHAR(32) NOT NULL DEFAULT 'FULL_TIME',
  "location" VARCHAR(180),
  "workArrangement" VARCHAR(80),
  "salaryRange" VARCHAR(120),
  "deadline" DATE,
  "summary" VARCHAR(1000) NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "qualifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ(6),
  "createdByAdminId" UUID,
  "updatedByAdminId" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerJob_slug_key" UNIQUE ("slug"),
  CONSTRAINT "CareerJob_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES public."Admin"("id") ON DELETE SET NULL,
  CONSTRAINT "CareerJob_updatedByAdminId_fkey" FOREIGN KEY ("updatedByAdminId") REFERENCES public."Admin"("id") ON DELETE SET NULL,
  CONSTRAINT "CareerJob_title_nonempty_check" CHECK (length(trim("title")) > 0),
  CONSTRAINT "CareerJob_department_nonempty_check" CHECK (length(trim("department")) > 0),
  CONSTRAINT "CareerJob_openings_positive_check" CHECK ("openings" > 0),
  CONSTRAINT "CareerJob_experience_range_check" CHECK ("experienceMinYears" >= 0 AND "experienceMaxYears" >= "experienceMinYears"),
  CONSTRAINT "CareerJob_employmentType_check" CHECK ("employmentType" IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY')),
  CONSTRAINT "CareerJob_status_check" CHECK ("status" IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'))
);

CREATE INDEX "CareerJob_status_updatedAt_idx" ON public."CareerJob" ("status", "updatedAt" DESC);
CREATE INDEX "CareerJob_status_publishedAt_idx" ON public."CareerJob" ("status", "publishedAt" DESC);

CREATE TABLE public."CareerApplication" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "jobId" UUID NOT NULL,
  "applicantName" VARCHAR(150) NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "phone" VARCHAR(32) NOT NULL,
  "city" VARCHAR(150) NOT NULL,
  "highestQualification" VARCHAR(180) NOT NULL,
  "experience" VARCHAR(180) NOT NULL,
  "skills" TEXT NOT NULL DEFAULT '',
  "resumeStorageKey" VARCHAR(500) NOT NULL,
  "resumeFileName" VARCHAR(255) NOT NULL,
  "resumeByteSize" INTEGER NOT NULL,
  "consentedAt" TIMESTAMPTZ(6) NOT NULL,
  "consentVersion" VARCHAR(40) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'NEW',
  "internalNotes" TEXT NOT NULL DEFAULT '',
  "idempotencyKey" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "statusUpdatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."CareerJob"("id") ON DELETE RESTRICT,
  CONSTRAINT "CareerApplication_idempotencyKey_key" UNIQUE ("idempotencyKey"),
  CONSTRAINT "CareerApplication_status_check" CHECK ("status" IN ('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED')),
  CONSTRAINT "CareerApplication_resumeByteSize_check" CHECK ("resumeByteSize" > 0 AND "resumeByteSize" <= 5242880)
);

CREATE INDEX "CareerApplication_jobId_createdAt_idx" ON public."CareerApplication" ("jobId", "createdAt" DESC);
CREATE INDEX "CareerApplication_status_createdAt_idx" ON public."CareerApplication" ("status", "createdAt" DESC);
CREATE INDEX "CareerApplication_email_createdAt_idx" ON public."CareerApplication" (lower("email"), "createdAt" DESC);

CREATE TABLE public."CareerApplicationStatusHistory" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "applicationId" UUID NOT NULL,
  "previousStatus" VARCHAR(20),
  "newStatus" VARCHAR(20) NOT NULL,
  "internalNote" TEXT,
  "changedByAdminId" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CareerApplicationStatusHistory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CareerApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."CareerApplication"("id") ON DELETE CASCADE,
  CONSTRAINT "CareerApplicationStatusHistory_changedByAdminId_fkey" FOREIGN KEY ("changedByAdminId") REFERENCES public."Admin"("id") ON DELETE SET NULL,
  CONSTRAINT "CareerApplicationStatusHistory_newStatus_check" CHECK ("newStatus" IN ('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED')),
  CONSTRAINT "CareerApplicationStatusHistory_previousStatus_check" CHECK ("previousStatus" IS NULL OR "previousStatus" IN ('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'))
);

CREATE INDEX "CareerApplicationStatusHistory_applicationId_createdAt_idx" ON public."CareerApplicationStatusHistory" ("applicationId", "createdAt" DESC);

INSERT INTO public."CareerJob" (
  "slug", "title", "department", "openings", "experienceMinYears", "experienceMaxYears",
  "employmentType", "summary", "description", "responsibilities", "qualifications", "status"
) VALUES
  (
    'telecaller', 'Telecaller', 'Customer Engagement / Telecalling', 1, 1, 3,
    'FULL_TIME',
    'Contact prospective customers, understand their requirements, respond to enquiries and maintain consistent follow-ups.',
    'This draft role supports customer communication and enquiry follow-up. An administrator should review the description before publication.',
    ARRAY['Make outbound and follow-up calls.', 'Communicate with customers professionally and understand their requirements.', 'Track enquiries and maintain accurate records.', 'Coordinate with the relevant team on customer follow-ups.'],
    ARRAY['Strong verbal communication and professional telephone etiquette.', 'Basic computer skills.', 'Accurate record-keeping.'],
    'DRAFT'
  ),
  (
    'digital-marketing-executive', 'Digital Marketing Executive', 'Marketing / Business Solutions', 1, 1, 3,
    'FULL_TIME',
    'Support digital marketing campaigns, strengthen online presence and help track campaign performance.',
    'This draft role supports JLUXE digital marketing and campaign coordination. An administrator should review the description before publication.',
    ARRAY['Assist with digital campaigns, social media and content activities.', 'Prepare basic performance reports.', 'Research competitors and coordinate campaign activities.'],
    ARRAY['Relevant digital marketing experience.', 'Familiarity with social media platforms.', 'Basic SEO and analytics knowledge.', 'Good communication skills.'],
    'DRAFT'
  )
ON CONFLICT ("slug") DO NOTHING;
