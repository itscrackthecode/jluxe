export const careerJobStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'] as const;
export const careerApplicationStatuses = ['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'] as const;
export const careerEmploymentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'] as const;

export type CareerJobStatus = typeof careerJobStatuses[number];
export type CareerApplicationStatus = typeof careerApplicationStatuses[number];
export type CareerEmploymentType = typeof careerEmploymentTypes[number];

export type CareerJob = {
  id: string;
  slug: string;
  title: string;
  department: string;
  openings: number;
  experienceMinYears: number;
  experienceMaxYears: number;
  employmentType: CareerEmploymentType;
  location: string | null;
  workArrangement: string | null;
  salaryRange: string | null;
  deadline: string | null;
  summary: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  status: CareerJobStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  applicationCount?: number;
};

export type CareerJobInput = Omit<CareerJob, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt' | 'applicationCount'>;

export const careerApplicationConsentVersion = 'careers-application-v1';
export const careerApplicationConsentText = 'I agree that JLUXE may use the information and resume I provide to review and process my application for this role.';
