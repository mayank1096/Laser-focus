import type { ClockTime, ISODate } from '../types/models';

const MONTHS = [
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
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day, never UTC: 11:30 PM in India is still today. */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Midnight, local time, of an ISO day. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: ISODate, b: ISODate): number {
  const ms = fromISODate(b).getTime() - fromISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Monday of the week containing `iso`. Weeks run Monday to Sunday. */
export function startOfWeek(iso: ISODate): ISODate {
  const day = fromISODate(iso).getDay();
  return addDays(iso, -((day + 6) % 7));
}

/** "Mon 6 Oct". */
export function formatDay(iso: ISODate): string {
  const d = fromISODate(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "5–11 Oct", or "29 Sep – 5 Oct" across months. */
export function formatWeekRange(monday: ISODate): string {
  const a = fromISODate(monday);
  const b = fromISODate(addDays(monday, 6));
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${
        MONTHS[b.getMonth()]
      }`;
}

/** 390 → "6:30 AM", 720 → "12:00 PM". */
export function formatClock(minutes: ClockTime): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(m % 60)} ${h24 < 12 ? 'AM' : 'PM'}`;
}

/** 1080, 1140 → "6–7 PM"; 720, 840 → "12–2 PM"; 660, 780 → "11 AM–1 PM". */
export function formatWindow(start: ClockTime, end: ClockTime): string {
  const part = (m: number) => {
    const h = Math.floor(m / 60) % 24;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return m % 60 ? `${h12}:${pad(m % 60)}` : `${h12}`;
  };
  const suffix = (m: number) => (Math.floor(m / 60) % 24 < 12 ? 'AM' : 'PM');
  return suffix(start) === suffix(end)
    ? `${part(start)}–${part(end)} ${suffix(end)}`
    : `${part(start)} ${suffix(start)}–${part(end)} ${suffix(end)}`;
}

/** "Morning", "Afternoon" or "Evening" for a start time. */
export function partOfDay(minutes: ClockTime): string {
  if (minutes < 12 * 60) {
    return 'Morning';
  }
  return minutes < 17 * 60 ? 'Afternoon' : 'Evening';
}

/** The session's own name, or its time of day when it has none. */
export function slotName(slot: { start: ClockTime; name?: string }): string {
  return slot.name?.trim() || partOfDay(slot.start);
}

/** 90 → "90 min", 180 → "3 h", 150 → "2 h 30 min". */
export function formatMinutes(total: number): string {
  if (total < 120) {
    return `${total} min`;
  }
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Minutes since midnight for a `Date`. */
export function clockOf(d: Date): ClockTime {
  return d.getHours() * 60 + d.getMinutes();
}
