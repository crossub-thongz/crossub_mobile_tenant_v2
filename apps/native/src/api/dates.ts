/**
 * Dates the tenant sees. Always DD/MM/YYYY, from the calendar date itself.
 * The phone's language and region do not change the order or the month names.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function fromParts(day: number, month: number, year: number): string {
  return `${pad(day)}/${pad(month)}/${year}`;
}

/** A calendar date as DD/MM/YYYY. A date-only value keeps the day written in the string. */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return fromParts(value.getDate(), value.getMonth() + 1, value.getFullYear());
  }
  const written = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.\d+)?Z)?$/.exec(value.trim());
  if (written) return `${written[3]}/${written[2]}/${written[1]}`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return fromParts(parsed.getDate(), parsed.getMonth() + 1, parsed.getFullYear());
}

/** Clock time as h:mm am/pm. Not taken from the device language. */
export function formatDisplayTime(value: string | Date | null | undefined): string {
  const parsed = value instanceof Date ? value : value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  const hours = parsed.getHours();
  const minutes = pad(parsed.getMinutes());
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

export function formatDisplayDateTime(value: string | Date | null | undefined): string {
  const date = formatDisplayDate(value);
  const time = formatDisplayTime(value);
  if (!date) return '';
  return time ? `${date}, ${time}` : date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** A visit window. Weekday letters stay in English. */
export function formatDisplayWindow(start: string | null, end: string | null): string | undefined {
  if (!start) return undefined;
  const opened = new Date(start);
  if (Number.isNaN(opened.getTime())) return formatDisplayDate(start) || undefined;
  const startText = `${WEEKDAYS[opened.getDay()]} ${formatDisplayDate(opened)}, ${formatDisplayTime(opened)}`;
  if (!end) return startText;
  const closed = new Date(end);
  if (Number.isNaN(closed.getTime())) return startText;
  return `${startText}–${formatDisplayTime(closed)}`;
}

/** A self-inspection the tenant can still photograph. */
export function routineSelfOpen(status: string | null | undefined, flow: string | null | undefined): boolean {
  if (flow !== 'self') return false;
  const value = (status || '').toLowerCase();
  return value !== 'completed' && value !== 'cancelled' && value !== 'published' && value !== 'under_review';
}
