import { createElement, Fragment, type ReactNode } from 'react';

function renderInline(source: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const pieces: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) pieces.push(source.slice(lastIndex, start));
    if (token.startsWith('**')) pieces.push(createElement('strong', { key: start }, token.slice(2, -2)));
    else if (token.startsWith('*')) pieces.push(createElement('em', { key: start }, token.slice(1, -1)));
    else if (token.startsWith('`')) pieces.push(createElement('code', { key: start, className: 'rounded bg-[#062f29]/10 px-1 py-0.5 font-mono text-[0.9em]' }, token.slice(1, -1)));
    else {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      let href = '';
      try {
        const url = new URL(link?.[2] ?? '');
        if (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:') href = url.href;
      } catch { /* Render invalid destinations as plain text. */ }
      pieces.push(href
        ? createElement('a', { key: start, href, target: '_blank', rel: 'noreferrer', className: 'underline underline-offset-2' }, link?.[1])
        : token);
    }
    lastIndex = start + token.length;
  }
  if (lastIndex < source.length) pieces.push(source.slice(lastIndex));
  return pieces;
}

export function renderMarkdown(markdown: string, className = '') {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let ordered = false;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push(createElement('p', { key: `p-${blocks.length}`, className: 'mb-3 last:mb-0' }, paragraph.map((line, i) => createElement(Fragment, { key: i }, i ? createElement('br') : null, ...renderInline(line)))));
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    const Tag = ordered ? 'ol' : 'ul';
    blocks.push(createElement(Tag, { key: `list-${blocks.length}`, className: `${ordered ? 'list-decimal' : 'list-disc'} mb-3 space-y-1 pl-5 last:mb-0` }, list.map((item, i) => createElement('li', { key: i }, ...renderInline(item)))));
    list = [];
  };
  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    if (!line.trim() || heading || unordered || numbered) {
      flushParagraph();
      if (!unordered && !numbered) flushList();
      if (heading) {
        const level = heading[1].length;
        const Tag = `h${level + 1}` as 'h2' | 'h3' | 'h4';
        blocks.push(createElement(Tag, { key: `h-${blocks.length}`, className: 'mb-2 font-semibold text-[#062f29]' }, ...renderInline(heading[2])));
      } else if (unordered || numbered) {
        const nextOrdered = Boolean(numbered);
        if (list.length && ordered !== nextOrdered) flushList();
        ordered = nextOrdered;
        list.push((unordered ?? numbered)?.[1] ?? '');
      }
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return <div className={className}>{blocks.length ? blocks : <p className="text-[#71807a]">Nothing to preview yet.</p>}</div>;
}

export default function MarkdownContent({ value, className }: { value: string; className?: string }) {
  return renderMarkdown(value, className);
}
