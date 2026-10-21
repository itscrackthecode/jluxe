import { z } from 'zod';
import { careerEmploymentTypes, careerJobStatuses } from './career-types';

const nullableText = (maximum: number) => z.preprocess(
  (value) => typeof value === 'string' && value.trim() === '' ? null : value,
  z.string().trim().max(maximum).nullable().optional().transform((value) => value ?? null),
);

const bulletList = z.array(z.string().trim().min(1).max(500)).max(30).default([]);

export const careerJobInputSchema = z.object({
  slug: z.string().trim().max(160).optional().default(''),
  title: z.string().trim().min(2).max(180),
  department: z.string().trim().min(2).max(120),
  openings: z.number().int().min(1).max(500),
  experienceMinYears: z.number().min(0).max(60),
  experienceMaxYears: z.number().min(0).max(60),
  employmentType: z.enum(careerEmploymentTypes),
  location: nullableText(180),
  workArrangement: nullableText(80),
  salaryRange: nullableText(120),
  deadline: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? null : value,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().transform((value) => value ?? null),
  ),
  summary: z.string().trim().max(1000).default(''),
  description: z.string().trim().max(10000).default(''),
  responsibilities: bulletList,
  qualifications: bulletList,
  status: z.enum(careerJobStatuses),
}).strict().superRefine((job, context) => {
  if (job.experienceMaxYears < job.experienceMinYears) {
    context.addIssue({ code: 'custom', path: ['experienceMaxYears'], message: 'Maximum experience must be at least the minimum.' });
  }
  if (job.deadline && Number.isNaN(Date.parse(`${job.deadline}T00:00:00Z`))) {
    context.addIssue({ code: 'custom', path: ['deadline'], message: 'Enter a valid deadline.' });
  }
  if (job.status === 'PUBLISHED') {
    if (job.summary.length < 10) context.addIssue({ code: 'custom', path: ['summary'], message: 'Add a summary before publishing.' });
    if (job.description.length < 20) context.addIssue({ code: 'custom', path: ['description'], message: 'Add a complete description before publishing.' });
    if (job.responsibilities.length === 0) context.addIssue({ code: 'custom', path: ['responsibilities'], message: 'Add responsibilities before publishing.' });
    if (job.qualifications.length === 0) context.addIssue({ code: 'custom', path: ['qualifications'], message: 'Add qualifications before publishing.' });
  }
});
