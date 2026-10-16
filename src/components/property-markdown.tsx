import type { ReactNode } from 'react';

function safeHref(value: string) {
  const href = value.trim();
  if (/^(https?:\/\/|mailto:)/i.test(href)) return href;
  if (/^\/(?!\/)/.test(href) || /^#[\w-]+$/.test(href)) return href;
  return null;
}

function inlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    const token = match[0];
    if (token.startsWith('**')) parts.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('*')) parts.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link ? safeHref(link[2]) : null;
      parts.push(href && link
        ? <a key={`${match.index}-link`} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="underline underline-offset-2">{link[1]}</a>
        : token);
    }
    cursor = pattern.lastIndex;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

/** A deliberately small, HTML-free Markdown renderer for legacy and admin-authored descriptions. */
export default function PropertyMarkdown({ source, className = '' }: { source: string; className?: string }) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p-${blocks.length}`} className="mb-4 last:mb-0">{inlineMarkdown(paragraph.join(' '))}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(<ul key={`ul-${blocks.length}`} className="mb-4 list-disc space-y-1 pl-5 last:mb-0">{list.map((item, index) => <li key={`${index}-${item}`}>{inlineMarkdown(item)}</li>)}</ul>);
    list = [];
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const item = line.match(/^\s*[-*+]\s+(.+)$/);
    if (!line.trim()) { flushParagraph(); flushList(); continue; }
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      const content = inlineMarkdown(heading[2]);
      blocks.push(level === 1
        ? <h3 key={`h-${blocks.length}`} className="mb-2 mt-5 font-display text-2xl first:mt-0">{content}</h3>
        : level === 2 ? <h4 key={`h-${blocks.length}`} className="mb-2 mt-4 font-display text-xl first:mt-0">{content}</h4> : <h5 key={`h-${blocks.length}`} className="mb-2 mt-3 font-semibold first:mt-0">{content}</h5>);
      continue;
    }
    if (item) { flushParagraph(); list.push(item[1]); continue; }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();

  return <div className={`property-markdown ${className}`}>{blocks}</div>;
}
