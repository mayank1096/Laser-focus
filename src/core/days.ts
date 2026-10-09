import type { ISODate } from '../types/models';
import { now } from '../utils/clock';
import { addDays, fromISODate, toISODate } from '../utils/date';

/** The app's day turns over at 3 AM, so marking at midnight counts for the right day. */
export const DAY_TURNS_AT_HOUR = 3;

/** The app day for a moment: before 3 AM still belongs to yesterday. */
export function appDay(at: Date = now()): ISODate {
  return toISODate(new Date(at.getTime() - DAY_TURNS_AT_HOUR * 3_600_000));
}

/** Minutes since midnight of the app day (can exceed 24 h before 3 AM). */
export function appMinutes(at: Date = now()): number {
  const day = fromISODate(appDay(at));
  return Math.floor((at.getTime() - day.getTime()) / 60_000);
}

/** A week starts the day after the review day. */
export function weekStart(date: ISODate, reviewDay: number): ISODate {
  const first = (reviewDay + 1) % 7;
  const dow = fromISODate(date).getDay();
  return addDays(date, -((dow - first + 7) % 7));
}

/** The review day that closes the week containing `date`. */
export function weekReviewDate(date: ISODate, reviewDay: number): ISODate {
  return addDays(weekStart(date, reviewDay), 6);
}

/** The last seven app days, oldest first, ending today. */
export function lastSeven(today: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
}
