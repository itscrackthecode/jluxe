'use client';

import Link from 'next/link';
import { useState } from 'react';
import { careerServiceAreaLabels, type CareerJob } from '@/lib/career-types';
import { careersHref } from '@/lib/careers-navigation';

const employmentLabels: Record<CareerJob['employmentType'], string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
};

function experienceLabel(minimum: number, maximum: number) {
  if (minimum === 0 && maximum === 0) return 'Experience not specified';
  if (minimum === maximum) return `${minimum} ${minimum === 1 ? 'year' : 'years'}`;
  return `${minimum}–${maximum} years`;
}

export default function CareersJobList({ jobs, basePath }: { jobs: CareerJob[]; basePath: string }) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const departments = [...new Set(jobs.map((job) => job.department))].sort((first, second) => first.localeCompare(second));
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = !normalizedSearch || `${job.title} ${job.department} ${job.summary}`.toLocaleLowerCase().includes(normalizedSearch);
    return matchesSearch && (!department || job.department === department);
  });

  return (
    <div>
      <div className="mb-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]">
        <label className="grid gap-2 text-sm font-medium text-[#103D33]">
          <span>Search positions</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Title, department or keyword" className="min-h-12 border border-[#103D33]/20 bg-white px-4 text-[#16392f] placeholder:text-[#677b73] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#103D33]">
          <span>Department</span>
          <select value={department} onChange={(event) => setDepartment(event.target.value)} className="min-h-12 border border-[#103D33]/20 bg-white px-4 text-[#16392f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">
            <option value="">All departments</option>
            {departments.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>
      {filteredJobs.length ? (
        <div className="divide-y divide-[#103D33]/15 border-y border-[#103D33]/15">
          {filteredJobs.map((job) => (
            <article key={job.id} className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:py-8">
              <div>
                <p className="text-sm font-semibold text-[#8a6a3c]">{job.department}</p>
                <h3 className="mt-2 font-display text-2xl text-[#103D33] sm:text-[1.75rem]">{job.title}</h3>
                {job.serviceArea ? <p className="mt-2 text-sm font-medium text-[#516b61]">Recruiting for JLUXE ({careerServiceAreaLabels[job.serviceArea]})</p> : null}
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#496259]">{job.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#516b61]">
                  <li>{job.openings === 0 ? 'Openings available' : `Openings available: ${job.openings}`}</li>
                  <li>{experienceLabel(job.experienceMinYears, job.experienceMaxYears)}</li>
                  <li>{employmentLabels[job.employmentType]}</li>
                  {job.location ? <li>{job.location}</li> : null}
                </ul>
              </div>
              <div className="flex flex-wrap gap-3 sm:justify-end">
                <Link href={careersHref(basePath, `/jobs/${job.slug}`)} className="inline-flex min-h-11 items-center justify-center border border-[#103D33]/30 px-4 text-sm font-semibold text-[#103D33] transition-colors hover:border-[#103D33] hover:bg-[#E9EEE9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">View details</Link>
                <Link href={careersHref(basePath, `/apply/${job.slug}`)} className="inline-flex min-h-11 items-center justify-center bg-[#103D33] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0a3028] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5A46D]">Apply now</Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="border-y border-[#103D33]/15 py-12 text-center">
          <p className="font-display text-2xl text-[#103D33]">{jobs.length ? 'No matching positions' : 'No current openings'}</p>
          <p className="mt-2 text-sm leading-6 text-[#52675f]">{jobs.length ? 'Try a different search or department.' : 'Please check back for future opportunities, or contact us with a recruitment enquiry.'}</p>
        </div>
      )}
    </div>
  );
}
