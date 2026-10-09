import type { ClockTime, ISODate } from '../types/models';
import { fromISODate } from '../utils/date';
import type { Strings } from './en';

/** 390 → "6:30 AM" (en) or "सुबह 6:30" (hi). */
export function clock(t: Strings, minutes: ClockTime): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (t.common.am === 'AM') {
    return `${h12}:${mm} ${h < 12 ? t.common.am : t.common.pm}`;
  }
  // Hindi names the part of the day: सुबह, दोपहर, शाम, रात.
  const part =
    h < 4 ? 'रात' : h < 12 ? 'सुबह' : h < 17 ? 'दोपहर' : h < 20 ? 'शाम' : 'रात';
  return `${part} ${h12}:${mm}`;
}

/** A Date's time of day, e.g. "6:04 AM". */
export function clockOf(t: Strings, at: Date): string {
  return clock(t, at.getHours() * 60 + at.getMinutes());
}

/** "14 Oct". */
export function shortDate(t: Strings, iso: ISODate): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${t.common.months[d.getMonth()]}`;
}

/** "Wed 14 Oct". */
export function dayDate(t: Strings, iso: ISODate): string {
  const d = fromISODate(iso);
  return `${t.common.dayShort[d.getDay()]} ${shortDate(t, iso)}`;
}

/** "Mar 2027" from "2027-03". */
export function monthLabel(t: Strings, month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${t.common.months[m - 1]} ${y}`;
}
