'use client';

import { useState } from 'react';
import MarkdownContent from '@/components/markdown-content';

export default function PrivateNotesEditor({
  value,
  onChange,
  id = 'private-notes-markdown',
  label = 'Private notes in Markdown',
  placeholder = 'Add private verification or coordination notes. Markdown is supported.',
  maxLength = 20000,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  return (
    <div className="overflow-hidden border border-white/15 bg-[#09221c]" data-notes-editor>
      <div className="flex border-b border-white/10" role="group" aria-label={`${label} editor mode`}>
        <button type="button" aria-pressed={mode === 'write'} onClick={() => setMode('write')} className={`min-h-10 border-b-2 px-4 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${mode === 'write' ? 'border-[var(--gold)] text-white' : 'border-transparent text-[#9caaa4] hover:text-white'}`}>Write</button>
        <button type="button" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')} className={`min-h-10 border-b-2 px-4 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${mode === 'preview' ? 'border-[var(--gold)] text-white' : 'border-transparent text-[#9caaa4] hover:text-white'}`}>Preview</button>
      </div>
      {mode === 'write' ? <div>
        <label className="sr-only" htmlFor={id}>{label}</label>
        <textarea id={id} rows={8} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-48 w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 text-[#f5f1e8] placeholder:text-white/35 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gold)]" />
        <p className="border-t border-white/10 px-4 py-2 text-[11px] text-[#9caaa4]">Markdown: headings, bold, italic, lists, inline code, and links.</p>
      </div> : <div className="min-h-48 bg-[#FAF9F6] p-4 text-sm leading-6 text-[#18332f]" aria-live="polite">
        <MarkdownContent value={value} />
      </div>}
    </div>
  );
}
