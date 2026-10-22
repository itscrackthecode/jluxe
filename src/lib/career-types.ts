export const careerJobStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'] as const;
export const careerApplicationStatuses = ['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'] as const;
export const careerEmploymentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'] as const;
export const careerServiceAreas = ['REAL_ESTATE', 'BUSINESS_SOLUTIONS', 'RECRUITMENT_AND_TRAINING', 'INTERIOR_DESIGN_AND_ARCHITECTURE', 'ALL_SERVICES'] as const;

export type CareerJobStatus = typeof careerJobStatuses[number];
export type CareerApplicationStatus = typeof careerApplicationStatuses[number];
export type CareerEmploymentType = typeof careerEmploymentTypes[number];
export type CareerServiceArea = typeof careerServiceAreas[number];

export const careerServiceAreaLabels: Record<CareerServiceArea, string> = {
  REAL_ESTATE: 'Real Estate',
  BUSINESS_SOLUTIONS: 'Business Solutions',
  RECRUITMENT_AND_TRAINING: 'Recruitment and Training',
  INTERIOR_DESIGN_AND_ARCHITECTURE: 'Interior Design and Architecture',
  ALL_SERVICES: 'All Services',
};

export type CareerJob = {
  id: string;
  slug: string;
  title: string;
  department: string;
  serviceArea: CareerServiceArea | null;
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
