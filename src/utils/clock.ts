import type { ISODate } from '../types/models';
import { toISODate } from './date';

let offsetMs = 0;

/**
 * The app's idea of "now". Everything date-based reads from here, so tests
 * and the design preview can move time forward (e.g. to a week later).
 */
export function now(): Date {
  return new Date(Date.now() + offsetMs);
}

export function today(): ISODate {
  return toISODate(now());
}

/** Shifts the app clock. Pass 0 to return to real time. */
export function setClockOffset(ms: number) {
  offsetMs = ms;
}
