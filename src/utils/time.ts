const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** 16 → "1 year 4 months", 12 → "1 year", 5 → "5 months". */
export function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  }
  if (months > 0 || years === 0) {
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  }
  return parts.join(' ');
}

/** ISO `YYYY-MM` for the month `offset` months after `from`. */
export function addMonths(from: Date, offset: number): string {
  const d = new Date(from.getFullYear(), from.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** `2027-02` → "Feb". */
export function shortMonthLabel(isoMonth: string): string {
  const month = Number(isoMonth.split('-')[1]);
  return MONTHS_SHORT[month - 1] ?? '';
}

/**
 * Spread `count` milestones evenly up to the deadline, last one landing on
 * the deadline month itself.
 */
export function distributeDueMonths(
  count: number,
  deadlineMonths: number,
  from: Date = new Date(),
): string[] {
  return Array.from({ length: count }, (_, i) =>
    addMonths(
      from,
      Math.max(1, Math.round(((i + 1) * deadlineMonths) / count)),
    ),
  );
}
