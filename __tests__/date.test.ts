import { addDays, daysBetween, formatClock, toISODate } from '../src/utils/date';
import { addMonths } from '../src/utils/time';

describe('date helpers', () => {
  it('uses the local calendar day', () => {
    expect(toISODate(new Date(2026, 9, 4, 23, 30))).toBe('2026-10-04');
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(daysBetween('2026-09-28', '2026-10-05')).toBe(7);
  });

  it('formats clock times and months', () => {
    expect(formatClock(0)).toBe('12:00 AM');
    expect(formatClock(390)).toBe('6:30 AM');
    expect(formatClock(21 * 60 + 30)).toBe('9:30 PM');
    expect(addMonths(new Date(2026, 10, 15), 3)).toBe('2027-02');
  });
});
