type DateInput = string | Date | null | undefined;

/** A Date, or null for anything missing or unparseable, so one bad CMS value drops a field instead of the page. */
export function parseDate(value: DateInput): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// CMS dates are date-only strings, which parse as UTC midnight. Formatting in
// UTC keeps the printed day the same whatever the server's time zone is.
function format(value: DateInput, options: Intl.DateTimeFormatOptions): string {
  const date = parseDate(value);
  return date ? date.toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' }) : '';
}

/** 3 September 2026 */
export const longDate = (value: DateInput) =>
  format(value, { day: 'numeric', month: 'long', year: 'numeric' });

/** 3 Sep 2026 */
export const shortDate = (value: DateInput) =>
  format(value, { day: 'numeric', month: 'short', year: 'numeric' });

/** Sep 2026 */
export const monthYear = (value: DateInput) => format(value, { month: 'short', year: 'numeric' });

export function year(value: DateInput): number | null {
  return parseDate(value)?.getUTCFullYear() ?? null;
}

/** The most recent of the given dates, or null when none parses. */
export function latest(values: DateInput[]): Date | null {
  let newest: Date | null = null;
  for (const value of values) {
    const date = parseDate(value);
    if (date && (!newest || date > newest)) newest = date;
  }
  return newest;
}
