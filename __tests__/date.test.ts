import {
  addDays,
  daysBetween,
  formatClock,
  formatDay,
  formatMinutes,
  formatWeekRange,
  formatWindow,
  partOfDay,
  startOfWeek,
  toISODate,
} from '../src/utils/date';

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

  it('starts weeks on Monday', () => {
    expect(startOfWeek('2026-10-04')).toBe('2026-09-28'); // Sunday
    expect(startOfWeek('2026-10-05')).toBe('2026-10-05'); // Monday
    expect(startOfWeek('2026-10-07')).toBe('2026-10-05');
  });

  it('formats days, weeks and times like the designs', () => {
    expect(formatDay('2026-10-05')).toBe('Mon 5 Oct');
    expect(formatWeekRange('2026-10-05')).toBe('5–11 Oct');
    expect(formatWeekRange('2026-09-28')).toBe('28 Sep – 4 Oct');
    expect(formatClock(0)).toBe('12:00 AM');
    expect(formatClock(390)).toBe('6:30 AM');
    expect(formatClock(720)).toBe('12:00 PM');
    expect(formatClock(21 * 60 + 30)).toBe('9:30 PM');
    expect(formatWindow(18 * 60, 19 * 60)).toBe('6–7 PM');
    expect(formatWindow(11 * 60, 13 * 60)).toBe('11 AM–1 PM');
    expect(formatWindow(13 * 60 + 30, 14 * 60 + 30)).toBe('1:30–2:30 PM');
  });

  it('names lengths and parts of the day', () => {
    expect(formatMinutes(90)).toBe('90 min');
    expect(formatMinutes(180)).toBe('3 h');
    expect(formatMinutes(150)).toBe('2 h 30 min');
    expect(partOfDay(6 * 60)).toBe('Morning');
    expect(partOfDay(14 * 60)).toBe('Afternoon');
    expect(partOfDay(19 * 60)).toBe('Evening');
  });
});
