import { siteConfig } from './data';

export type EmailField = {
  label: string;
  value: string | null | undefined;
  linkUrl?: string;
  highlight?: boolean;
};
export type EmailSection = { title: string; fields: EmailField[] };
export type JluxeEmail = {
  title: string;
  summary: string;
  reference?: string | null;
  sections: EmailSection[];
  images?: Array<{ url: string; alt: string }>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function imageUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

export function formatEmailDate(value: Date | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC',
  }).format(date).replace(' at ', ', ').replace(/\b(am|pm)\b/, (period) => period.toUpperCase());
}

export function renderJluxeEmail(email: JluxeEmail) {
  const sections = email.sections.map((section) => {
    const fields = section.fields.filter((field) => field.value !== null && field.value !== undefined && field.value !== '')
      .map(({ label, value, linkUrl, highlight }) => {
        const safeLink = linkUrl ? imageUrl(linkUrl) : null;
        const escapedValue = escapeHtml(value!).replace(/\r\n|\r|\n/g, '<br/>');
        const content = safeLink
          ? `<a href="${escapeHtml(safeLink)}" style="color:#062F29;text-decoration:underline">${escapedValue}</a>`
          : escapedValue;
        if (highlight) {
          return `<tr><td colspan="2" style="padding:7px 0 10px"><div style="background-color:#FAF9F6;border-left:3px solid #C5A46D;padding:14px 16px;color:#062F29;font-size:14px;line-height:1.7;word-break:break-word;overflow-wrap:anywhere"><strong style="display:block;margin-bottom:6px;color:#5d6d68;font-size:12px">${escapeHtml(label)}</strong>${content}</div></td></tr>`;
        }
        return `<tr><td style="padding:8px 12px 8px 0;color:#5d6d68;font-size:13px;vertical-align:top;width:38%">${escapeHtml(label)}</td><td style="padding:8px 0;color:#062F29;font-size:14px;line-height:1.6;vertical-align:top;word-break:break-word">${content}</td></tr>`;
      }).join('');
    if (!fields) return '';
    return `<tr><td style="padding:22px 28px 6px"><h2 style="margin:0;color:#062F29;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700">${escapeHtml(section.title)}</h2></td></tr><tr><td style="padding:8px 28px 18px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${fields}</table></td></tr>`;
  }).join('');
  const images = (email.images ?? []).map(({ url, alt }) => {
    const safeUrl = imageUrl(url);
    return safeUrl ? `<tr><td style="padding:0 28px 14px"><img src="${escapeHtml(safeUrl)}" alt="${escapeHtml(alt)}" width="560" style="display:block;width:100%;max-width:560px;max-height:320px;height:auto;border:0" /></td></tr>` : '';
  }).join('');
  const reference = email.reference ? `<tr><td style="padding:12px 28px 0;color:#5d6d68;font-family:Arial,Helvetica,sans-serif;font-size:12px">Reference: <strong style="color:#062F29">${escapeHtml(email.reference)}</strong></td></tr>` : '';
  const text = [
    'JLUXE', email.title, email.summary,
    ...(email.reference ? [`Reference: ${email.reference}`] : []),
    ...email.sections.flatMap((section) => {
      const fields = section.fields.filter((field) => field.value !== null && field.value !== undefined && field.value !== '');
      return fields.length ? ['', section.title, ...fields.map(({ label, value, linkUrl }) => `${label}: ${value}${linkUrl ? ` (${linkUrl})` : ''}`)] : [];
    }),
    '', `JLUXE | ${siteConfig.url} | ${siteConfig.contact.email}`,
  ].join('\n');

  const html = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#FAF9F6" style="background-color:#FAF9F6;margin:0;padding:0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:620px;background-color:#ffffff;border:1px solid #e7e5df"><tr><td bgcolor="#062F29" style="background-color:#062F29;padding:24px 28px;border-bottom:3px solid #C5A46D"><div style="color:#FAF9F6;font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:3px">JLUXE</div><div style="padding-top:5px;color:#d9e2dc;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px">ENQUIRY NOTIFICATION</div></td></tr><tr><td style="padding:28px 28px 8px"><h1 style="margin:0;color:#062F29;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.3;font-weight:normal">${escapeHtml(email.title)}</h1><p style="margin:12px 0 0;color:#465851;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7">${escapeHtml(email.summary)}</p></td></tr>${reference}${images}${sections}<tr><td style="padding:20px 28px 26px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-top:1px solid #C5A46D;padding-top:16px;color:#465851;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6">Please review this submission and follow up with the customer using their preferred contact details.</td></tr></table></td></tr><tr><td bgcolor="#062F29" style="background-color:#062F29;padding:18px 28px;color:#d9e2dc;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7">JLUXE<br/><a href="${escapeHtml(siteConfig.url)}" style="color:#FAF9F6;text-decoration:underline">${escapeHtml(siteConfig.url.replace(/^https?:\/\//, ''))}</a> &nbsp;|&nbsp; <a href="mailto:${escapeHtml(siteConfig.contact.email)}" style="color:#FAF9F6;text-decoration:underline">${escapeHtml(siteConfig.contact.email)}</a></td></tr></table></td></tr></table>`;
  return { html, text };
}
