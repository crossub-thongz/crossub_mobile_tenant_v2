/**
 * Workflow mail stores the HTML that was sent, including the "Open Tenant (Mobile)" button.
 * The message thread paints that body as text, so the tags were showing where the button belongs.
 * Convert markup to the words and the link. Do not render the HTML.
 */

const HTML_TAG_PATTERN = /<\/?[a-z][\w-]*(?=[\s/>])[^>]*>/i;
const ANGLE_LINK_PATTERN = /([^\s<>]*)<((?:https?:\/\/|mailto:)[^\s<>]+)>/gi;
const MAILTO_SCHEME_PATTERN = /^mailto:/i;
const ANGLE_ADDRESS_PATTERN = /<([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/g;
const NON_CONTENT_BLOCK_PATTERN = /<(style|script|head|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const ANCHOR_PATTERN = /<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi;

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
};

function containsHtmlMarkup(value: string): boolean {
  return HTML_TAG_PATTERN.test(value);
}

function bareUrl(value: string): string {
  return value
    .trim()
    .replace(/^(https?:\/\/|mailto:|tel:)/i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function anchorToText(href: string, label: string): string {
  const url = href.trim();
  const text = label.trim();
  if (!url) return text;
  if (!text) return url;
  const bareText = bareUrl(text);
  if (!bareText) return url;
  if (bareText === bareUrl(url)) return text;
  if (bareUrl(url).startsWith(bareText)) return url;
  return `${text}: ${url}`;
}

function unwrapAngleLinks(text: string): string {
  return text.replace(ANGLE_LINK_PATTERN, (_match, label: string, target: string) => {
    const address = target.replace(MAILTO_SCHEME_PATTERN, '');
    if (!label) return address;
    if (bareUrl(label) === bareUrl(target)) return label;
    return `${label} ${address}`;
  });
}

function htmlToPlainText(html: string): string {
  return html
    .replace(NON_CONTENT_BLOCK_PATTERN, '')
    .replace(ANGLE_ADDRESS_PATTERN, '&lt;$1&gt;')
    .replace(ANCHOR_PATTERN, (_match, _quoted, doubleQuoted, singleQuoted, unquoted, label) =>
      anchorToText(String(doubleQuoted ?? singleQuoted ?? unquoted ?? ''), String(label ?? '')),
    )
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li\b[^>]*>/gi, '• ')
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos|mdash|ndash);/gi, (entity) => HTML_ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Text a message bubble or inbox preview should show. Plain copy is left as typed. */
export function toDisplayMessageText(value: string | null | undefined): string {
  if (!value) return '';
  const text = unwrapAngleLinks(value);
  return containsHtmlMarkup(text) ? htmlToPlainText(text) : text;
}
