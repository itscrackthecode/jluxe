'use client';

import { useCallback, useEffect, useState } from 'react';
import { careerServiceAreaLabels, careerServiceAreas, type CareerApplicationStatus, type CareerJob, type CareerJobStatus, type CareerServiceArea } from '@/lib/career-types';
import PrivateNotesEditor from '@/components/admin/private-notes-editor';

type ApplicationRow = {
  id: string; applicantName: string; email: string; phone: string; city: string;
  experience: string; status: CareerApplicationStatus; jobId: string; jobTitle: string;
  jobSlug: string; createdAt: string;
};
type ApplicationDetail = ApplicationRow & {
  highestQualification: string; skills: string; resumeFileName: string;
  resumeByteSize: number; consentedAt: string; consentVersion: string;
  internalNotes: string; resumeAvailable: boolean;
  history: { previousStatus: CareerApplicationStatus | null; newStatus: CareerApplicationStatus; internalNote: string | null; createdAt: string; changedBy: string | null }[];
};

const jobStatuses: CareerJobStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'];
const workTypes = ['ONSITE', 'HYBRID', 'REMOTE'] as const;
const applicationStatuses: CareerApplicationStatus[] = ['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];
const employmentTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'] as const;
type CareerJobForm = Omit<CareerJob, 'id' | 'publishedAt' | 'createdAt' | 'updatedAt' | 'applicationCount' | 'openings'> & { openings: string };
const blankJob = (): CareerJobForm => ({
  slug: '', title: '', department: '', serviceArea: null, openings: '', experienceMinYears: 1,
  experienceMaxYears: 3, employmentType: 'FULL_TIME', location: null,
  workArrangement: null, salaryRange: null, deadline: null, summary: '',
  description: '', responsibilities: [], qualifications: [], status: 'DRAFT',
});

const inputClass = 'mt-1 min-h-11 w-full rounded-md border border-white/15 bg-[#061815] px-3 py-2 text-sm text-white placeholder:text-[#82918b] focus:border-[var(--gold)] focus:outline-none';
const buttonClass = 'inline-flex min-h-10 items-center justify-center rounded-md border border-white/20 px-4 text-sm font-medium text-white transition hover:border-[var(--gold)] hover:bg-white/5 disabled:opacity-50';
const labelClass = 'block text-xs font-medium text-[#c6d0cb]';

function cleanSalaryInput(value: string) {
  return value.replace(/[₹,\s]/g, '').split('.')[0].replace(/\D/g, '');
}

function formatSalaryInput(value: string) {
  if (!value || !/^[₹\s\d,]*$/.test(value)) return value;
  const digits = cleanSalaryInput(value);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function messageFrom(data: unknown, fallback: string) {
  return typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string' ? data.error : fallback;
}

export default function CareersAdmin({ canReviewApplications }: { canReviewApplications: boolean }) {
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [job, setJob] = useState<CareerJobForm>(blankJob);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jobEditorOpen, setJobEditorOpen] = useState(false);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [applicationSearch, setApplicationSearch] = useState('');
  const [applicationSearchInput, setApplicationSearchInput] = useState('');
  const [applicationPage, setApplicationPage] = useState(1);
  const [applicationPages, setApplicationPages] = useState(0);
  const [applicationTotal, setApplicationTotal] = useState(0);
  const [selected, setSelected] = useState<ApplicationDetail | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [retentionDays, setRetentionDays] = useState('365');
  const [busy, setBusy] = useState(false);
  const [updatingJobStatus, setUpdatingJobStatus] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const request = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, { ...init, headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers }, cache: 'no-store' });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(messageFrom(data, 'The request could not be completed.'));
    return data;
  }, []);

  const loadJobs = useCallback(async () => {
    const result = await request('/admin/api/careers/jobs');
    setJobs(result.data as CareerJob[]);
  }, [request]);

  const loadApplications = useCallback(async () => {
    if (!canReviewApplications) return;
    const query = new URLSearchParams({ limit: '50', page: String(applicationPage) });
    if (applicationSearch.trim()) query.set('search', applicationSearch.trim());
    if (filterStatus) query.set('status', filterStatus);
    if (filterJob) query.set('jobId', filterJob);
    if (filterFrom) query.set('from', filterFrom);
    if (filterTo) query.set('to', filterTo);
    const result = await request(`/admin/api/careers/applications?${query}`);
    setApplications(result.data as ApplicationRow[]);
    setApplicationTotal(result.pagination.total as number);
    setApplicationPages(result.pagination.totalPages as number);
  }, [applicationPage, applicationSearch, canReviewApplications, filterFrom, filterJob, filterStatus, filterTo, request]);

  const refresh = useCallback(async () => {
    try {
      await Promise.all([loadJobs(), loadApplications()]);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load Careers data.'); }
  }, [loadApplications, loadJobs]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function loadApplication(id: string) {
    setError('');
    try {
      const result = await request(`/admin/api/careers/applications/${id}`);
      setSelected(result.data as ApplicationDetail);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load application.'); }
  }

  function editJob(value: CareerJob) {
    const input = Object.fromEntries(Object.entries(value).filter(([key]) => !['id', 'publishedAt', 'createdAt', 'updatedAt', 'applicationCount'].includes(key))) as CareerJobForm;
    setEditingId(value.id);
    setJob({ ...input, openings: String(value.openings) });
    setJobEditorOpen(true);
    setNotice(''); setError('');
    window.requestAnimationFrame(() => document.getElementById('careers-job-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function openNewJob() {
    setEditingId(null); setJob(blankJob()); setJobEditorOpen(true); setNotice(''); setError('');
    window.requestAnimationFrame(() => document.getElementById('careers-job-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function closeJobEditor() {
    setJobEditorOpen(false); setEditingId(null); setJob(blankJob());
  }

  async function saveJob(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(''); setError('');
    if (!/^\d+$/.test(job.openings) || Number(job.openings) > 500) {
      setError('Enter a whole-number opening count from 0 to 500.');
      return;
    }
    setBusy(true);
    try {
      await request(editingId ? `/admin/api/careers/jobs/${editingId}` : '/admin/api/careers/jobs', {
        method: editingId ? 'PATCH' : 'POST', body: JSON.stringify({ ...job, openings: Number(job.openings) }),
      });
      setNotice(editingId ? 'Vacancy saved.' : 'Vacancy created.');
      setEditingId(null); setJob(blankJob()); setJobEditorOpen(false); await loadJobs();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save vacancy.'); }
    finally { setBusy(false); }
  }

  async function updateJobStatus(value: CareerJob, status: CareerJobStatus) {
    const input = Object.fromEntries(Object.entries(value).filter(([key]) => !['id', 'publishedAt', 'createdAt', 'updatedAt', 'applicationCount'].includes(key))) as ReturnType<typeof blankJob>;
    setUpdatingJobStatus(value.id); setNotice(''); setError('');
    try {
      await request(`/admin/api/careers/jobs/${value.id}`, { method: 'PATCH', body: JSON.stringify({ ...input, status }) });
      setJobs((current) => current.map((item) => item.id === value.id ? { ...item, status } : item));
      setNotice(`${value.title} status updated to ${status}.`);
      try { await loadJobs(); }
      catch { setError('Status was saved, but the vacancy list could not be refreshed.'); }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to update vacancy status.');
    } finally { setUpdatingJobStatus(null); }
  }

  async function saveApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setNotice(''); setError('');
    try {
      await request(`/admin/api/careers/applications/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ status: form.get('status'), internalNotes: form.get('internalNotes') }) });
      setNotice('Application updated.'); await loadApplications(); await loadApplication(selected.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to update application.'); }
    finally { setBusy(false); }
  }

  async function deleteApplication() {
    if (!selected || !window.confirm('Delete this application and its private resume? This cannot be undone.')) return;
    setBusy(true); setNotice(''); setError('');
    try {
      await request(`/admin/api/careers/applications/${selected.id}`, { method: 'DELETE' });
      setSelected(null); setNotice('Application deleted.'); await loadApplications();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to delete application.'); }
    finally { setBusy(false); }
  }

  async function runRetention(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm(`Permanently delete applications older than ${retentionDays} days, including their resumes?`)) return;
    setBusy(true); setNotice(''); setError('');
    try {
      const result = await request('/admin/api/careers/applications/retention', { method: 'POST', body: JSON.stringify({ days: Number(retentionDays) }) });
      setNotice(`Retention completed: ${result.deleted} deleted, ${result.failed} failed. The batch limit is ${result.batchLimit}. Run again to process another batch.`);
      setSelected(null); await loadApplications();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to process retention.'); }
    finally { setBusy(false); }
  }

  function setField<K extends keyof typeof job>(key: K, value: (typeof job)[K]) {
    setJob((current) => ({ ...current, [key]: value }));
  }

  const salaryIsLegacyText = Boolean(job.salaryRange && !/^[₹\s\d,]*$/.test(job.salaryRange));

  return (
    <div className="space-y-8 text-[#f5f1e8]">
      <header>
        <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">PEOPLE &amp; OPPORTUNITY</p>
        <h1 className="mt-3 font-display text-4xl text-white">Careers</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9caaa4]">Manage vacancy content and, for Owners and Admins, review candidate applications.</p>
      </header>
      {error && <p role="alert" className="rounded-md border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-100">{notice}</p>}

      <section className="rounded-lg border border-white/10 bg-[#08201b] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-display text-2xl text-white">Vacancies</h2><p className="mt-1 text-sm text-[#9caaa4]">Drafts remain private; publishing makes a vacancy visible on the public Careers site.</p></div>
          <button className={buttonClass} type="button" onClick={openNewJob}>New vacancy</button>
        </div>
        <div className="mt-5 divide-y divide-white/10">
          {jobs.map((item) => <article key={item.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="font-medium text-white">{item.title}</h3><p className="mt-1 text-xs text-[#9caaa4]">{item.department} · {item.openings === 0 ? 'Openings available' : `Openings available: ${item.openings}`} · {item.applicationCount ?? 0} applications</p></div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor={`vacancy-status-${item.id}`}>Status for {item.title}</label>
              <select id={`vacancy-status-${item.id}`} className="min-h-10 rounded-md border border-white/15 bg-[#061815] px-3 text-sm text-white focus:border-[var(--gold)] focus:outline-none disabled:opacity-50" value={item.status} disabled={updatingJobStatus !== null} onChange={(event) => void updateJobStatus(item, event.target.value as CareerJobStatus)}>
                {jobStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button className={buttonClass} type="button" onClick={() => editJob(item)}>Edit</button>
            </div>
          </article>)}
          {!jobs.length && <p className="py-6 text-sm text-[#9caaa4]">No vacancies found.</p>}
        </div>
      </section>

      {jobEditorOpen && <section id="careers-job-editor" className="scroll-mt-6 rounded-lg border border-white/10 bg-[#08201b] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl text-white">{editingId ? 'Edit vacancy' : 'Create vacancy'}</h2><button className={buttonClass} type="button" onClick={closeJobEditor}>Close</button></div>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={saveJob}>
          <label className={labelClass}>Job title<input className={inputClass} required minLength={2} maxLength={180} value={job.title} onChange={(e) => setField('title', e.target.value)} /></label>
          <label className={labelClass}>Department<input className={inputClass} required minLength={2} maxLength={120} value={job.department} onChange={(e) => setField('department', e.target.value)} /></label>
          <label className={labelClass}>Service Area<select className={inputClass} value={job.serviceArea ?? ''} onChange={(e) => setField('serviceArea', (e.target.value || null) as CareerServiceArea | null)}><option value="">Select a service area</option>{careerServiceAreas.map((serviceArea) => <option key={serviceArea} value={serviceArea}>{serviceArea === 'ALL_SERVICES' ? 'All JLUXE Services' : careerServiceAreaLabels[serviceArea]}</option>)}</select></label>
          <label className={labelClass}>URL slug (optional; generated from title)<input className={inputClass} maxLength={160} value={job.slug} onChange={(e) => setField('slug', e.target.value)} /></label>
          <label className={labelClass}>Openings<input className={inputClass} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} required value={job.openings} onChange={(e) => setField('openings', e.target.value.replace(/\D/g, ''))} /></label>
          <label className={labelClass}>Employment type<select className={inputClass} value={job.employmentType} onChange={(e) => setField('employmentType', e.target.value as typeof job.employmentType)}>{employmentTypes.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
          <label className={labelClass}>Minimum experience (years)<input className={inputClass} type="number" min="0" max="60" step="0.5" required value={job.experienceMinYears} onChange={(e) => setField('experienceMinYears', Number(e.target.value))} /></label>
          <label className={labelClass}>Maximum experience (years)<input className={inputClass} type="number" min="0" max="60" step="0.5" required value={job.experienceMaxYears} onChange={(e) => setField('experienceMaxYears', Number(e.target.value))} /></label>
          <label className={labelClass}>Location (only if confirmed)<input className={inputClass} maxLength={180} value={job.location ?? ''} onChange={(e) => setField('location', e.target.value || null)} /></label>
          <label className={labelClass}>Work Type (only if confirmed)<select className={inputClass} value={job.workArrangement ?? ''} onChange={(e) => setField('workArrangement', e.target.value || null)}><option value="">Select work type</option>{job.workArrangement && !workTypes.includes(job.workArrangement as (typeof workTypes)[number]) && <option value={job.workArrangement}>{job.workArrangement}</option>}{workTypes.map((type) => <option key={type} value={type}>{type === 'ONSITE' ? 'Onsite' : type === 'HYBRID' ? 'Hybrid' : 'Remote'}</option>)}</select></label>
          <label className={labelClass}>Salary (INR, optional)<span className="mt-1 flex min-h-11 items-center rounded-md border border-white/15 bg-[#061815] focus-within:border-[var(--gold)]">{!salaryIsLegacyText && <span className="px-3 text-sm text-white" aria-hidden="true">₹</span>}<input aria-label="Salary in Indian rupees" inputMode="numeric" value={formatSalaryInput(job.salaryRange ?? '')} onChange={(e) => setField('salaryRange', cleanSalaryInput(e.target.value) || null)} className={`min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm text-white outline-none ${salaryIsLegacyText ? 'pl-3' : ''}`} placeholder="Enter amount" /></span></label>
          <label className={labelClass}>Application deadline<input className={inputClass} type="date" value={job.deadline ?? ''} onChange={(e) => setField('deadline', e.target.value || null)} /></label>
          <div className="md:col-span-2"><h3 className={`${labelClass} mb-2`}>Short summary</h3><PrivateNotesEditor id="career-short-summary" label="Short summary in Markdown" placeholder="Write a short role summary. Markdown is supported." maxLength={1000} toolbar="full" value={job.summary} onChange={(value) => setField('summary', value)} /></div>
          <div className="md:col-span-2"><h3 className={`${labelClass} mb-2`}>Description</h3><PrivateNotesEditor id="career-description" label="Description in Markdown" placeholder="Describe the role. Markdown is supported." maxLength={10000} toolbar="full" value={job.description} onChange={(value) => setField('description', value)} /></div>
          <div className="md:col-span-2"><h3 className={`${labelClass} mb-2`}>Responsibilities <span className="font-normal">(one item per line)</span></h3><PrivateNotesEditor id="career-responsibilities" label="Responsibilities in Markdown, one item per line" placeholder="Enter one responsibility per line. Markdown is supported within each item." maxLength={15000} toolbar="inline" value={job.responsibilities.join('\n')} previewValue={job.responsibilities.map((item) => `- ${item}`).join('\n')} onChange={(value) => setField('responsibilities', value.split('\n').map((line) => line.trim()).filter(Boolean))} /></div>
          <div className="md:col-span-2"><h3 className={`${labelClass} mb-2`}>Qualifications <span className="font-normal">(one item per line)</span></h3><PrivateNotesEditor id="career-qualifications" label="Qualifications in Markdown, one item per line" placeholder="Enter one qualification per line. Markdown is supported within each item." maxLength={15000} toolbar="inline" value={job.qualifications.join('\n')} previewValue={job.qualifications.map((item) => `- ${item}`).join('\n')} onChange={(value) => setField('qualifications', value.split('\n').map((line) => line.trim()).filter(Boolean))} /></div>
          <div className="flex flex-wrap gap-3 md:col-span-2"><button className={buttonClass} type="submit" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save vacancy' : 'Create vacancy'}</button><button className={buttonClass} type="button" onClick={() => { setEditingId(null); setJob(blankJob()); }}>Clear</button></div>
        </form>
      </section>}

      {canReviewApplications && <section className="rounded-lg border border-white/10 bg-[#08201b] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-2xl text-white">Applications</h2><p className="mt-1 text-sm text-[#9caaa4]">Candidate details and resumes are restricted to Owners and Admins.</p></div>
          <form className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => { event.preventDefault(); setApplicationSearch(applicationSearchInput.trim()); setApplicationPage(1); }}>
            <input aria-label="Search applicants" className="min-h-10 rounded-md border border-white/15 bg-[#061815] px-3 text-sm text-white placeholder:text-[#82918b]" placeholder="Search name, email or vacancy" value={applicationSearchInput} onChange={(e) => setApplicationSearchInput(e.target.value)} />
            <select aria-label="Filter by status" className="min-h-10 rounded-md border border-white/15 bg-[#061815] px-3 text-sm text-white" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setApplicationPage(1); }}><option value="">All statuses</option>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select>
            <select aria-label="Filter by vacancy" className="min-h-10 rounded-md border border-white/15 bg-[#061815] px-3 text-sm text-white" value={filterJob} onChange={(e) => { setFilterJob(e.target.value); setApplicationPage(1); }}><option value="">All vacancies</option>{jobs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
            <label className="text-xs text-[#9caaa4]">From<input aria-label="Applications from date" type="date" className="mt-1 min-h-10 w-full rounded-md border border-white/15 bg-[#061815] px-3 text-sm text-white" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setApplicationPage(1); }} /></label>
            <label className="text-xs text-[#9caaa4]">Through<input aria-label="Applications through date" type="date" className="mt-1 min-h-10 w-full rounded-md border border-white/15 bg-[#061815] px-3 text-sm text-white" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setApplicationPage(1); }} /></label>
            <button type="submit" className={buttonClass}>Search applications</button>
          </form>
        </div>
        <div className="mt-4 divide-y divide-white/10">{applications.map((application) => <button key={application.id} type="button" onClick={() => void loadApplication(application.id)} className="flex w-full flex-col gap-1 py-3 text-left hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"><span><span className="block font-medium text-white">{application.applicantName}</span><span className="text-xs text-[#9caaa4]">{application.jobTitle} · {application.city}</span></span><span className="text-xs text-[#c6d0cb]">{application.status} · {new Date(application.createdAt).toLocaleDateString()}</span></button>)}{!applications.length && <p className="py-6 text-sm text-[#9caaa4]">No applications match these filters.</p>}</div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-[#9caaa4]"><span>{applicationTotal} application{applicationTotal === 1 ? '' : 's'} · Page {applicationPage} of {Math.max(applicationPages, 1)}</span><div className="flex gap-2"><button className={buttonClass} type="button" disabled={busy || applicationPage <= 1} onClick={() => setApplicationPage((page) => page - 1)}>Previous</button><button className={buttonClass} type="button" disabled={busy || applicationPage >= applicationPages} onClick={() => setApplicationPage((page) => page + 1)}>Next</button></div></div>
        {selected && <div className="mt-6 rounded-md border border-[var(--gold)]/30 bg-[#061815] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-xl text-white">{selected.applicantName}</h3><p className="mt-1 text-sm text-[#c6d0cb]">{selected.jobTitle}</p></div><button className={buttonClass} type="button" onClick={() => setSelected(null)}>Close</button></div>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#9caaa4]">Email</dt><dd><a className="underline" href={`mailto:${selected.email}`}>{selected.email}</a></dd></div><div><dt className="text-xs text-[#9caaa4]">Phone</dt><dd><a className="underline" href={`tel:${selected.phone}`}>{selected.phone}</a></dd></div><div><dt className="text-xs text-[#9caaa4]">City</dt><dd>{selected.city}</dd></div><div><dt className="text-xs text-[#9caaa4]">Qualification</dt><dd>{selected.highestQualification}</dd></div><div><dt className="text-xs text-[#9caaa4]">Experience</dt><dd>{selected.experience}</dd></div><div><dt className="text-xs text-[#9caaa4]">Skills</dt><dd>{selected.skills}</dd></div></dl>
          {selected.resumeAvailable && <a className={`${buttonClass} mt-4`} href={`/admin/api/careers/applications/${selected.id}/resume`}>Download resume ({selected.resumeFileName}, {Math.ceil(selected.resumeByteSize / 1024)} KB)</a>}
          <form key={selected.id} className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveApplication}><label className={labelClass}>Application status<select name="status" className={inputClass} defaultValue={selected.status}>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className={`${labelClass} sm:col-span-2`}>Internal notes<textarea name="internalNotes" className={inputClass} rows={4} maxLength={10000} defaultValue={selected.internalNotes} /></label><button className={`${buttonClass} justify-self-start`} type="submit" disabled={busy}>Save review</button></form>
          <details className="mt-4"><summary className="cursor-pointer text-sm text-[#c6d0cb]">Status history ({selected.history.length})</summary><ul className="mt-2 space-y-2 text-xs text-[#9caaa4]">{selected.history.map((item, index) => <li key={`${item.createdAt}-${index}`}>{item.previousStatus ? `${item.previousStatus} → ` : ''}{item.newStatus} · {new Date(item.createdAt).toLocaleString()}{item.changedBy ? ` · ${item.changedBy}` : ''}</li>)}</ul></details>
          <button className={`${buttonClass} mt-5 border-red-400/40 text-red-200 hover:border-red-300`} type="button" disabled={busy} onClick={() => void deleteApplication()}>Delete application and resume</button>
        </div>}
        <form onSubmit={runRetention} className="mt-6 flex flex-wrap items-end gap-3 border-t border-white/10 pt-5"><label className={labelClass}>Delete applications older than (days)<input className={`${inputClass} w-44`} type="number" min="1" max="36500" required value={retentionDays} onChange={(e) => setRetentionDays(e.target.value)} /></label><button className={buttonClass} type="submit" disabled={busy}>Run retention batch</button><p className="basis-full text-xs text-[#9caaa4]">This permanently removes matching application records and private resumes, up to 50 per run.</p></form>
      </section>}
    </div>
  );
}
