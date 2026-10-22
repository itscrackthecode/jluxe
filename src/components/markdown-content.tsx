import { createElement, Fragment, type ReactNode } from 'react';

function renderInline(source: string): ReactNode[] {
  const pattern = /(!\[[^\]]*\]\([^)]+\)|\*\*\*[^*]+\*\*\*|___[^_]+___|~~[^~]+~~|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const pieces: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of source.matchAll(pattern)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) pieces.push(source.slice(lastIndex, start));
    if (token.startsWith('***') || token.startsWith('___')) pieces.push(createElement('strong', { key: start }, createElement('em', null, token.slice(3, -3))));
    else if (token.startsWith('~~')) pieces.push(createElement('del', { key: start }, token.slice(2, -2)));
    else if (token.startsWith('**') || token.startsWith('__')) pieces.push(createElement('strong', { key: start }, token.slice(2, -2)));
    else if (token.startsWith('*') || token.startsWith('_')) pieces.push(createElement('em', { key: start }, token.slice(1, -1)));
    else if (token.startsWith('`')) pieces.push(createElement('code', { key: start, className: 'rounded bg-[#062f29]/10 px-1 py-0.5 font-mono text-[0.9em]' }, token.slice(1, -1)));
    else if (token.startsWith('![')) {
      const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(token);
      let src = '';
      try {
        const url = new URL(image?.[2] ?? '');
        if (url.protocol === 'https:' || url.protocol === 'http:') src = url.href;
      } catch { /* Render invalid image destinations as plain text. */ }
      pieces.push(src
        ? createElement('img', { key: start, src, alt: image?.[1] ?? '', loading: 'lazy', className: 'my-3 h-auto max-w-full' })
        : token);
    }
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
  let quote: string[] = [];
  let codeBlock: string[] | null = null;
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
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(createElement('blockquote', { key: `quote-${blocks.length}`, className: 'mb-3 border-l-2 border-[#C5A46D] pl-4 italic last:mb-0' }, quote.map((line, i) => createElement(Fragment, { key: i }, i ? createElement('br') : null, ...renderInline(line)))));
    quote = [];
  };
  const flushCodeBlock = () => {
    if (codeBlock === null) return;
    blocks.push(createElement('pre', { key: `code-${blocks.length}`, className: 'mb-3 overflow-x-auto rounded bg-[#062f29]/10 p-3 font-mono text-sm last:mb-0' }, createElement('code', null, codeBlock.join('\n'))));
    codeBlock = null;
  };
  for (const line of lines) {
    if (codeBlock !== null) {
      if (/^\s*```/.test(line)) flushCodeBlock();
      else codeBlock.push(line);
      continue;
    }
    if (/^\s*```/.test(line)) {
      flushParagraph(); flushList(); flushQuote();
      codeBlock = [];
      continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    const unordered = /^\s*[-*+]\s+(.+)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
    const quoted = /^\s*>\s?(.*)$/.exec(line);
    if (quoted) {
      flushParagraph(); flushList();
      quote.push(quoted[1]);
      continue;
    }
    flushQuote();
    if (!line.trim() || heading || unordered || numbered) {
      flushParagraph();
      if (!unordered && !numbered) flushList();
      if (heading) {
        const level = heading[1].length;
        const Tag = `h${Math.min(level + 1, 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
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
  flushCodeBlock();
  flushQuote();
  flushParagraph();
  flushList();
  return <div className={className}>{blocks.length ? blocks : <p className="text-[#71807a]">Nothing to preview yet.</p>}</div>;
}

export default function MarkdownContent({ value, className }: { value: string; className?: string }) {
  return renderMarkdown(value, className);
}
