'use client';

import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { enquiryStatuses, type EnquiryStatus } from '@/lib/db/types';

type EnquiryStatusValue = EnquiryStatus;
type EnquiryDetails = {
  id: string;
  name: string;
  email: string;
  phone: string;
  interestedServiceId: string | null;
  interestedServiceLabel: string;
  propertyId: string | null;
  message: string;
  status: EnquiryStatusValue;
  createdAt: string;
  updatedAt: string;
  interestedService: { title: string; slug: string } | null;
  property: { title: string; slug: string; location: string | null } | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

export default function EnquiryDetail({ id }: { id: string }) {
  const [enquiry, setEnquiry] = useState<EnquiryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<EnquiryStatusValue | ''>('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEnquiry() {
      setLoading(true);
      setError(false);
      setNotFound(false);
      try {
        const response = await fetch(`/admin/api/enquiries/${encodeURIComponent(id)}`, { signal: controller.signal });
        const result = await response.json();
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok || result.success !== true) throw new Error('Enquiry request failed.');
        setEnquiry(result.data as EnquiryDetails);
        setStatus(result.data.status as EnquiryStatusValue);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadEnquiry();
    return () => controller.abort();
  }, [id, retry]);

  async function updateStatus() {
    if (!status || !enquiry || status === enquiry.status) return;
    setSaving(true);
    setFeedback('');
    try {
      const response = await fetch(`/admin/api/enquiries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error('Status update failed.');
      setEnquiry((current) => (current ? { ...current, status: result.data.status, updatedAt: result.data.updatedAt } : current));
      setFeedback('Status updated.');
    } catch {
      setFeedback('We couldn’t update the status. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p role="status" className="py-10 text-sm text-[#9caaa4]">Loading enquiry...</p>;
  if (notFound) return <p className="border-y border-white/15 py-10 text-sm text-[#9caaa4]">Enquiry not found.</p>;
  if (error || !enquiry) {
    return (
      <div role="alert" className="border-y border-white/15 py-10">
        <p className="text-sm text-[#9caaa4]">We couldn’t load this enquiry right now.</p>
        <button
          type="button"
          onClick={() => setRetry((current) => current + 1)}
          className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:underline"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="text-[#f5f1e8]">
      <Link href="/admin/enquiries" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#9caaa4] transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All enquiries
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 border-b border-white/15 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--gold)]">ENQUIRY</p>
          <h1 className="mt-2 font-display text-4xl text-white">{enquiry.name}</h1>
        </div>
        <div className="flex items-end gap-3">
          <label className="text-xs font-medium text-[#9caaa4]">
            <span className="mb-1.5 block">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as EnquiryStatusValue)}
              className="min-h-10 border border-white/15 bg-[#09221c] px-3 text-sm text-[#f5f1e8] outline-none focus:border-[var(--gold)]"
            >
              {enquiryStatuses.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={saving || status === enquiry.status}
            onClick={updateStatus}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--viridian-950)] transition-colors hover:bg-[var(--gold)]/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>

      {feedback && (
        <p role="status" className="mt-4 rounded border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {feedback}
        </p>
      )}

      <dl className="mt-6 grid gap-x-8 gap-y-6 rounded-lg border border-white/10 bg-[#08201b] p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-[#9caaa4]">Email</dt>
          <dd className="mt-1 text-sm font-medium text-white">
            <a href={`mailto:${enquiry.email}`} className="break-all hover:text-[var(--gold)]">
              {enquiry.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#9caaa4]">Phone / WhatsApp</dt>
          <dd className="mt-1 text-sm font-medium text-white">
            <a href={`tel:${enquiry.phone.replace(/[^\d+]/g, '')}`} className="hover:text-[var(--gold)]">
              {enquiry.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#9caaa4]">Interested service</dt>
          <dd className="mt-1 text-sm font-medium text-white">
            {enquiry.interestedServiceLabel}
            {enquiry.interestedService ? ` (${enquiry.interestedService.title})` : ''}
          </dd>
        </div>
        {enquiry.propertyId && (
          <div>
            <dt className="text-xs font-medium text-[#9caaa4]">Property</dt>
            <dd className="mt-1 text-sm font-medium text-white">{enquiry.property?.title ?? 'Property reference'}</dd>
            {enquiry.property?.location && <dd className="mt-1 text-xs text-[#9caaa4]">{enquiry.property.location}</dd>}
            <dd className="mt-2"><Link href={`/admin/properties/${enquiry.propertyId}`} className="text-xs font-semibold text-[var(--gold)] hover:underline">Review property and photos</Link></dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium text-[#9caaa4]">Submitted</dt>
          <dd className="mt-1 text-sm text-[#f5f1e8]">{formatDate(enquiry.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#9caaa4]">Last updated</dt>
          <dd className="mt-1 text-sm text-[#f5f1e8]">{formatDate(enquiry.updatedAt)}</dd>
        </div>
      </dl>

      <section className="mt-6 rounded-lg border border-white/10 bg-[#08201b] p-6">
        <h2 className="text-xs font-semibold tracking-[0.18em] text-[var(--gold)]">MESSAGE</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#f5f1e8]">{enquiry.message}</p>
      </section>
    </div>
  );
}
