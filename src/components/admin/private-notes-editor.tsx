'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import MarkdownContent from '@/components/markdown-content';

export default function PrivateNotesEditor({
  value,
  onChange,
  id = 'private-notes-markdown',
  label = 'Private notes in Markdown',
  placeholder = 'Add private verification or coordination notes. Markdown is supported.',
  maxLength = 20000,
  previewValue,
  toolbar,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  previewValue?: string;
  toolbar?: 'inline' | 'full';
}) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after = before, placeholder = 'text') {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const content = selected || placeholder;
    const updated = `${value.slice(0, start)}${before}${content}${after}${value.slice(end)}`;
    onChange(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + content.length);
    });
  }

  function prefixLines(prefix: string, placeholder = 'List item') {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const nextLineBreak = value.indexOf('\n', end);
    const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
    const selected = value.slice(lineStart, lineEnd) || placeholder;
    const updatedLines = selected.split('\n').map((line) => `${prefix}${line}`).join('\n');
    const updated = `${value.slice(0, lineStart)}${updatedLines}${value.slice(lineEnd)}`;
    onChange(updated);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + updatedLines.length);
    });
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === 'b') {
      event.preventDefault();
      wrapSelection('**');
    } else if (key === 'i') {
      event.preventDefault();
      wrapSelection('*');
    } else if (key === 's' && event.shiftKey) {
      event.preventDefault();
      wrapSelection('~~');
    } else if (key === 'k') {
      event.preventDefault();
      wrapSelection('[', '](https://example.com)', 'link text');
    } else if (key === 'e') {
      event.preventDefault();
      wrapSelection('`');
    }
  }

  const toolbarButton = (label: string, action: () => void, title = label) => (
    <button key={label} type="button" title={title} aria-label={title} onMouseDown={(event) => event.preventDefault()} onClick={action} className="min-h-8 shrink-0 border-r border-white/10 px-2.5 text-xs font-semibold text-[#c6d0cb] hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)]">{label}</button>
  );

  const toolbarActions = toolbar ? [
    toolbarButton('B', () => wrapSelection('**'), 'Bold'),
    toolbarButton('I', () => wrapSelection('*'), 'Italic'),
    toolbarButton('B/I', () => wrapSelection('***'), 'Bold and italic'),
    toolbarButton('S̶', () => wrapSelection('~~'), 'Strikethrough'),
    toolbarButton('</>', () => wrapSelection('`'), 'Inline code'),
    toolbarButton('Link', () => wrapSelection('[', '](https://example.com)', 'link text'), 'Insert link'),
    ...(toolbar === 'full' ? [
      ...[1, 2, 3, 4, 5, 6].map((level) => toolbarButton(`H${level}`, () => prefixLines(`${'#'.repeat(level)} `, 'Heading'), `Heading ${level}`)),
      toolbarButton('• List', () => prefixLines('- '), 'Bulleted list'),
      toolbarButton('1. List', () => prefixLines('1. '), 'Numbered list'),
      toolbarButton('Quote', () => prefixLines('> ', 'Quoted text'), 'Blockquote'),
      toolbarButton('Image', () => wrapSelection('![', '](https://example.com/image.jpg)', 'alt text'), 'Insert image'),
      toolbarButton('Code block', () => wrapSelection('```\n', '\n```\n', 'code'), 'Code block'),
    ] : []),
  ] : [];

  return (
    <div className="overflow-hidden border border-white/15 bg-[#09221c]" data-notes-editor>
      <div className="flex border-b border-white/10" role="group" aria-label={`${label} editor mode`}>
        <button type="button" aria-pressed={mode === 'write'} onClick={() => setMode('write')} className={`min-h-10 border-b-2 px-4 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${mode === 'write' ? 'border-[var(--gold)] text-white' : 'border-transparent text-[#9caaa4] hover:text-white'}`}>Write</button>
        <button type="button" aria-pressed={mode === 'preview'} onClick={() => setMode('preview')} className={`min-h-10 border-b-2 px-4 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold)] ${mode === 'preview' ? 'border-[var(--gold)] text-white' : 'border-transparent text-[#9caaa4] hover:text-white'}`}>Preview</button>
      </div>
      {mode === 'write' ? <div>
        {toolbar && <div className="flex overflow-x-auto border-b border-white/10" role="toolbar" aria-label={`${label} formatting`}>
          {toolbarActions}
        </div>}
        <label className="sr-only" htmlFor={id}>{label}</label>
        <textarea ref={textareaRef} id={id} rows={8} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={handleEditorKeyDown} placeholder={placeholder} className="min-h-48 w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 text-[#f5f1e8] placeholder:text-white/35 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gold)]" />
        <p className="border-t border-white/10 px-4 py-2 text-[11px] text-[#9caaa4]">{toolbar === 'full' ? 'Use formatting buttons for emphasis, headings, lists, quotes, links, images, and code.' : toolbar === 'inline' ? 'Use formatting buttons for emphasis, inline code, and links within each item.' : 'Markdown: headings, bold, italic, lists, inline code, and links.'}</p>
      </div> : <div className="min-h-48 bg-[#FAF9F6] p-4 text-sm leading-6 text-[#18332f]" aria-live="polite">
        <MarkdownContent value={previewValue ?? value} />
      </div>}
    </div>
  );
}
