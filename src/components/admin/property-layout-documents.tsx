'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Eye, FileImage, FileText, Trash2, Upload, X } from 'lucide-react';

type LayoutFile = { id: string; propertyId: string; fileName: string; mimeType: string; byteSize: number; createdAt: string };

export default function PropertyLayoutDocuments({ propertyId }: { propertyId: string | null }) {
  const [files, setFiles] = useState<LayoutFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<LayoutFile | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const refresh = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const response = await fetch(`/admin/api/properties/${propertyId}/layout-documents`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Could not load layout plans.');
      setFiles(result.data as LayoutFile[]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load layout plans.'); }
    finally { setLoading(false); }
  }, [propertyId]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function upload(file?: File) {
    if (!propertyId || !file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Each layout plan must be no larger than 10 MB.'); return; }
    setUploading(true); setError('');
    try {
      const data = new FormData(); data.set('file', file);
      const response = await fetch(`/admin/api/properties/${propertyId}/layout-documents`, { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Could not upload layout plan.');
      setFiles((current) => [result.data as LayoutFile, ...current]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not upload layout plan.'); }
    finally { setUploading(false); if (input.current) input.current.value = ''; }
  }

  async function remove(file: LayoutFile) {
    if (!propertyId || !window.confirm(`Remove "${file.fileName}" from this property's layout plans?`)) return;
    setError('');
    try {
      const response = await fetch(`/admin/api/properties/${propertyId}/layout-documents/${file.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error ?? 'Could not remove layout plan.');
      setFiles((current) => current.filter((item) => item.id !== file.id));
      if (preview?.id === file.id) setPreview(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not remove layout plan.'); }
  }

  const url = (file: LayoutFile, previewMode = false) => `/admin/api/properties/${propertyId}/layout-documents/${file.id}${previewMode ? '?preview=1' : ''}`;
  return <div>
    {!propertyId ? <p className="border border-dashed border-white/20 bg-[#08201b] px-4 py-4 text-sm leading-6 text-[#9caaa4]">Save the property first. Then reopen it to upload layout plans.</p> : <>
      <div className="flex flex-wrap items-center gap-3"><label className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded bg-[var(--viridian-800)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--viridian-700)] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--gold)] ${uploading ? 'cursor-wait opacity-60' : ''}`}><Upload className="h-4 w-4" />{uploading ? 'Uploading…' : 'Upload layout plan'}<input ref={input} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" disabled={uploading} className="sr-only" onChange={(event) => { void upload(event.currentTarget.files?.[0]); }} /></label><span className="text-xs text-[#9caaa4]">PDF, JPEG, PNG or WebP · up to 10 MB each</span></div>
      {error && <p role="alert" className="mt-3 border-l-2 border-red-400 bg-red-950/30 px-3 py-2 text-sm text-red-200">{error}</p>}
      <div className="mt-4 space-y-2">{loading ? <p className="text-sm text-[#9caaa4]">Loading layout plans…</p> : files.length ? files.map((file) => <div key={file.id} className="flex flex-col gap-3 border border-white/10 bg-[#08201b] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3">{file.mimeType === 'application/pdf' ? <FileText className="h-5 w-5 shrink-0 text-[var(--gold)]" /> : <FileImage className="h-5 w-5 shrink-0 text-[var(--gold)]" />}<div className="min-w-0"><p className="break-all text-sm font-medium text-[#f5f1e8]">{file.fileName}</p><p className="mt-0.5 text-xs text-[#9caaa4]">{file.mimeType === 'application/pdf' ? 'PDF' : file.mimeType.split('/')[1].toUpperCase()} · {(file.byteSize / 1024).toFixed(0)} KB</p></div></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => setPreview(file)} className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs font-medium text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Eye className="h-3.5 w-3.5" />Preview</button><a href={url(file)} className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs font-medium text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Download className="h-3.5 w-3.5" />Download</a><button type="button" aria-label={`Remove ${file.fileName}`} onClick={() => void remove(file)} className="inline-flex min-h-9 min-w-9 items-center justify-center border border-white/20 text-white hover:border-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]"><Trash2 className="h-4 w-4" /></button></div></div>) : <p className="border border-dashed border-white/15 px-4 py-5 text-center text-sm text-[#9caaa4]">No layout plans uploaded.</p>}</div>
    </>}
    {preview && propertyId && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-8" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}><section role="dialog" aria-modal="true" aria-labelledby="layout-preview-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col border border-white/15 bg-[#FAF9F6] shadow-2xl"><div className="flex items-center justify-between gap-4 border-b border-[#062f29]/15 px-4 py-3 sm:px-6"><div className="min-w-0"><p className="text-[10px] font-semibold tracking-[0.18em] text-[#88744d]">PROPERTY LAYOUT PLAN</p><h3 id="layout-preview-title" className="mt-1 truncate font-display text-lg text-[#062f29]">{preview.fileName}</h3></div><button type="button" onClick={() => setPreview(null)} aria-label="Close layout preview" className="inline-flex h-10 w-10 items-center justify-center text-[#062f29] hover:bg-[#062f29]/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46D]"><X className="h-5 w-5" /></button></div><div className="min-h-[55vh] flex-1 overflow-auto bg-[#e7e8e3] p-3">{preview.mimeType === 'application/pdf' ? <iframe title={`Preview of ${preview.fileName}`} src={url(preview, true)} className="h-[65vh] min-h-[420px] w-full border-0" /> : <img src={url(preview, true)} alt={`Preview of ${preview.fileName}`} className="mx-auto max-h-[70vh] max-w-full object-contain" />}</div><div className="flex justify-end border-t border-[#062f29]/15 px-4 py-3 sm:px-6"><a href={url(preview)} className="inline-flex min-h-9 items-center gap-2 bg-[#062f29] px-4 text-xs font-semibold text-white hover:bg-[#0b443b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C5A46D]"><Download className="h-3.5 w-3.5" />Download</a></div></section></div>}
  </div>;
}
