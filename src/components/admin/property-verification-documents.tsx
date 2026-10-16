'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, Trash2, Upload, X } from 'lucide-react';

type VerificationDocument = {
  id: string;
  propertyId: string;
  fileName: string;
  mimeType: 'application/pdf' | 'application/msword';
  byteSize: number;
  createdAt: string;
};

const maxBytes = 4 * 1024 * 1024;
const inputClass = 'min-h-10 w-full border border-white/15 bg-[#09221c] px-3 py-2 text-sm text-[#f5f1e8] placeholder:text-white/30 outline-none focus-visible:border-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)]/30';

export default function PropertyVerificationDocuments({ propertyId }: { propertyId: string | null }) {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [preview, setPreview] = useState<VerificationDocument | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refreshDocuments = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const response = await fetch(`/admin/api/properties/${propertyId}/verification-documents`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error ?? 'Unable to load verification documents.');
      setDocuments(result.data as VerificationDocument[]);
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load verification documents.' });
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { void refreshDocuments(); }, [refreshDocuments]);

  async function upload(file?: File) {
    if (!file || !propertyId) return;
    if (file.size > maxBytes) {
      setMessage({ type: 'error', text: 'Each verification document must be no larger than 4 MB.' });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.set('file', file);
      const response = await fetch(`/admin/api/properties/${propertyId}/verification-documents`, { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error ?? 'Unable to upload verification document.');
      setDocuments((current) => [result.data as VerificationDocument, ...current]);
      setMessage({ type: 'success', text: 'Verification document uploaded.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to upload verification document.' });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function remove(document: VerificationDocument) {
    if (!propertyId || !window.confirm(`Remove "${document.fileName}" from this property's private verification documents?`)) return;
    try {
      const response = await fetch(`/admin/api/properties/${propertyId}/verification-documents/${document.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.error ?? 'Unable to remove document.');
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      setMessage({ type: 'success', text: 'Verification document removed.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to remove document.' });
    }
  }

  const fileUrl = (document: VerificationDocument) => `/admin/api/properties/${propertyId}/verification-documents/${document.id}`;

  return (
    <div>
      {!propertyId ? (
        <p className="border border-dashed border-white/20 bg-[#08201b] px-4 py-4 text-sm leading-6 text-[#9caaa4]">
          Save the property first. Then open it for editing to upload and manage its private verification documents.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded bg-[var(--viridian-800)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--viridian-700)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--gold)] ${uploading ? 'cursor-wait opacity-60' : ''}`}>
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload PDF or DOC'}
              <input ref={fileInput} type="file" accept=".pdf,.doc,application/pdf,application/msword" disabled={uploading} className="sr-only" onChange={(event) => { void upload(event.currentTarget.files?.[0]); }} />
            </label>
            <span className="text-xs text-[#9caaa4]">PDF or legacy DOC · up to 4 MB per file · private to JLUXE admins</span>
          </div>
          {message && <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-3 border-l-2 px-3 py-2 text-sm ${message.type === 'error' ? 'border-red-400 bg-red-950/30 text-red-200' : 'border-emerald-400 bg-emerald-950/30 text-emerald-200'}`}>{message.text}</p>}
          <div className="mt-4 space-y-2">
            {loading ? <p className="text-sm text-[#9caaa4]">Loading verification documents…</p>
              : documents.length === 0 ? <p className="border border-dashed border-white/15 px-4 py-5 text-center text-sm text-[#9caaa4]">No verification documents uploaded.</p>
                : documents.map((document) => (
                  <div key={document.id} className="flex flex-col gap-3 border border-white/10 bg-[#08201b] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--gold)]" />
                      <div className="min-w-0">
                        <p className="break-all text-sm font-medium text-[#f5f1e8]">{document.fileName}</p>
                        <p className="mt-0.5 text-xs text-[#9caaa4]">{document.mimeType === 'application/pdf' ? 'PDF' : 'DOC'} · {(document.byteSize / 1024).toFixed(0)} KB · {new Date(document.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button type="button" onClick={() => setPreview(document)} className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs font-medium text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Eye className="h-3.5 w-3.5" /> Preview</button>
                      <a href={fileUrl(document)} className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs font-medium text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Download className="h-3.5 w-3.5" /> Download</a>
                      <button type="button" aria-label={`Remove ${document.fileName}`} onClick={() => void remove(document)} className="inline-flex min-h-9 min-w-9 items-center justify-center border border-white/20 text-[#f5f1e8] hover:border-red-400 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
          </div>
        </>
      )}

      {preview && propertyId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-8" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="verification-document-preview-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col border border-white/15 bg-[#FAF9F6] shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-[#062f29]/15 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[#88744d]">PRIVATE VERIFICATION DOCUMENT</p>
                <h3 id="verification-document-preview-title" className="mt-1 truncate font-display text-lg text-[#062f29]">{preview.fileName}</h3>
              </div>
              <button type="button" onClick={() => setPreview(null)} aria-label="Close document preview" className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#062f29] hover:bg-[#062f29]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46D]"><X className="h-5 w-5" /></button>
            </div>
            <div className="min-h-[55vh] flex-1 bg-[#e7e8e3]">
              <iframe title={`Preview of ${preview.fileName}`} src={`${fileUrl(preview)}?preview=1`} className="h-[65vh] min-h-[420px] w-full border-0" />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#062f29]/15 px-4 py-3 sm:px-6">
              <p className="text-xs text-[#61716d]">PDF files preview in the browser. DOC preview depends on browser support.</p>
              <a href={fileUrl(preview)} className="inline-flex min-h-9 items-center gap-2 bg-[#062f29] px-4 text-xs font-semibold text-white hover:bg-[#0b443b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46D]"><Download className="h-3.5 w-3.5" /> Download</a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
