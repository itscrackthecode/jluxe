'use client';

import { useRef, useState } from 'react';
import PropertyMarkdown from '@/components/property-markdown';

const editorClass = 'min-h-52 w-full resize-y bg-transparent px-4 py-4 text-sm leading-7 text-[#f5f1e8] outline-none placeholder:text-[#9caaa4]/70 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gold)]';

export default function PropertyDescriptionEditor({ value, onChange, maxLength }: { value: string; onChange: (value: string) => void; maxLength: number }) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after = before, fallback = 'text') {
    const input = textareaRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    onChange(next.slice(0, maxLength));
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  function addLink() {
    const input = textareaRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    const label = value.slice(start, end) || 'link text';
    const href = window.prompt('Enter a website link (https://) or email address (mailto:)');
    if (!href) return;
    const next = `${value.slice(0, start)}[${label}](${href.trim()})${value.slice(end)}`;
    onChange(next.slice(0, maxLength));
  }

  return (
    <div className="overflow-hidden border border-white/15 bg-[#071a16] focus-within:border-[var(--gold)]/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        {mode === 'write' && <div className="flex flex-wrap gap-1" aria-label="Description formatting">
          <button type="button" onClick={() => wrapSelection('**', '**', 'bold text')} aria-label="Bold" title="Bold" className="h-9 min-w-9 border border-white/10 px-2 text-sm font-bold text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">B</button>
          <button type="button" onClick={() => wrapSelection('*', '*', 'italic text')} aria-label="Italic" title="Italic" className="h-9 min-w-9 border border-white/10 px-2 text-sm italic text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">I</button>
          <button type="button" onClick={() => wrapSelection('## ', '', 'Section heading')} aria-label="Heading" title="Heading" className="h-9 border border-white/10 px-2 text-xs font-semibold text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">H2</button>
          <button type="button" onClick={() => wrapSelection('\n- ', '', 'List item')} aria-label="Bullet list" title="Bullet list" className="h-9 border border-white/10 px-2 text-xs text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">List</button>
          <button type="button" onClick={addLink} aria-label="Add link" title="Add link" className="h-9 border border-white/10 px-2 text-xs text-white hover:border-[var(--gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">Link</button>
        </div>}
        <div className="flex border border-white/10 p-0.5" role="tablist" aria-label="Description mode">
          {(['write', 'preview'] as const).map((tab) => <button key={tab} type="button" role="tab" aria-selected={mode === tab} onClick={() => setMode(tab)} className={`min-h-8 px-3 text-xs capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${mode === tab ? 'bg-[var(--gold)] text-[var(--viridian-950)]' : 'text-[#9caaa4] hover:text-white'}`}>{tab}</button>)}
        </div>
      </div>
      {mode === 'write'
        ? <textarea ref={textareaRef} maxLength={maxLength} rows={8} value={value} onChange={(event) => onChange(event.target.value)} className={editorClass} aria-label="Property description" placeholder="Describe the property, project, and key details…" />
        : <div className={`${editorClass} overflow-y-auto`} role="tabpanel" aria-label="Description preview">{value.trim() ? <PropertyMarkdown source={value} /> : <p className="text-[#9caaa4]">Your formatted description will appear here.</p>}</div>}
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 text-[11px] text-[#9caaa4]">
        <span>Plain text and Markdown are supported. HTML is displayed as text.</span>
        <span aria-live="polite">{value.length.toLocaleString()} / {maxLength.toLocaleString()}</span>
      </div>
    </div>
  );
}
