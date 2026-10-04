import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Id, ISODate } from '../../types/models';
import { addDays } from '../../utils/date';
import { planFor, type PlanningState } from '../planning/store';

/** The course's minimum threshold: ten minutes sat still earns a half mark. */
export const HALF_MARK_MINUTES = 10;

export type Finished = 'yes' | 'partly' | 'no';
/** ● full, 〰 half (showed up 10 min+), missed, or nothing planned. */
export type DayMark = 'full' | 'half' | 'missed' | 'pending' | 'empty';

export interface ActiveSession {
  date: ISODate;
  slotId: Id;
  taskId: Id | null;
  startedAt: string;
  minutes: number;
}

export interface SessionResult {
  date: ISODate;
  slotId: Id;
  taskId: Id | null;
  startedAt: string;
  endedAt: string;
  /** Minutes actually sat. */
  minutes: number;
  plannedMinutes: number;
  endedEarly: boolean;
  earlyReason?: string;
  finished?: Finished;
  /** The result in one line, e.g. "64/100 in 3 h 02". */
  note?: string;
  /** What pulled you away, when it wasn't finished. */
  brokeBecause?: string[];
}

interface SessionData {
  active: ActiveSession | null;
  results: Record<ISODate, Record<Id, SessionResult>>;
}

interface SessionActions {
  start: (session: Omit<ActiveSession, 'startedAt'>, at: Date) => void;
  /** Ends the active session, early or on time. Returns its result. */
  end: (at: Date, early?: { reason: string }) => SessionResult | null;
  review: (
    date: ISODate,
    slotId: Id,
    patch: Pick<SessionResult, 'finished' | 'note' | 'brokeBecause'>,
  ) => void;
  reset: () => void;
}

export type SessionState = SessionData & SessionActions;

export const useSessions = create<SessionState>()(
  persist(
    (set, get) => ({
      active: null,
      results: {},

      start: (session, at) =>
        set({ active: { ...session, startedAt: at.toISOString() } }),

      end: (at, early) => {
        const active = get().active;
        if (!active) {
          return null;
        }
        const sat = Math.max(
          0,
          Math.floor((at.getTime() - Date.parse(active.startedAt)) / 60000),
        );
        const result: SessionResult = {
          date: active.date,
          slotId: active.slotId,
          taskId: active.taskId,
          startedAt: active.startedAt,
          endedAt: at.toISOString(),
          minutes: early ? Math.min(sat, active.minutes) : active.minutes,
          plannedMinutes: active.minutes,
          endedEarly: Boolean(early),
          earlyReason: early?.reason,
        };
        set(s => ({
          active: null,
          results: {
            ...s.results,
            [active.date]: {
              ...s.results[active.date],
              [active.slotId]: result,
            },
          },
        }));
        return result;
      },

      review: (date, slotId, patch) =>
        set(s => {
          const current = s.results[date]?.[slotId];
          if (!current) {
            return s;
          }
          return {
            results: {
              ...s.results,
              [date]: {
                ...s.results[date],
                [slotId]: { ...current, ...patch },
              },
            },
          };
        }),

      reset: () => set({ active: null, results: {} }),
    }),
    {
      name: 'laser-focus/sessions',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ active, results }) => ({ active, results }),
    },
  ),
);

/** Whether a result counts toward the day: sat the full time. */
export const isComplete = (r: SessionResult) =>
  !r.endedEarly || r.minutes >= r.plannedMinutes;

/** The mark a day earns from its planned sessions and their results. */
export function dayMark(
  sessions: Pick<SessionData, 'results'>,
  planning: PlanningState,
  date: ISODate,
  today: ISODate,
): DayMark {
  const planned = planFor(planning, date).sessions.filter(s => s.task);
  const results = Object.values(sessions.results[date] ?? {});
  if (planned.length === 0 && results.length === 0) {
    return 'empty';
  }
  const done = planned.filter(s => {
    const r = sessions.results[date]?.[s.slot.id];
    return r && isComplete(r);
  });
  if (planned.length > 0 && done.length === planned.length) {
    return 'full';
  }
  if (results.some(r => r.minutes >= HALF_MARK_MINUTES)) {
    return 'half';
  }
  return date === today ? 'pending' : 'missed';
}

/**
 * Consecutive days with a full or half mark, counting back from today (or
 * from yesterday, while today is still open).
 */
export function streak(
  sessions: Pick<SessionData, 'results'>,
  planning: PlanningState,
  today: ISODate,
): number {
  let day = today;
  let mark = dayMark(sessions, planning, day, today);
  if (mark === 'pending' || mark === 'empty') {
    day = addDays(day, -1);
  }
  let count = 0;
  for (let i = 0; i < 3650; i++) {
    mark = dayMark(sessions, planning, day, today);
    if (mark !== 'full' && mark !== 'half') {
      break;
    }
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

/** The last result written for a task, to show "was 62 in 3 h 10". */
export function lastResultFor(
  sessions: Pick<SessionData, 'results'>,
  taskId: Id | null,
  before: ISODate,
): SessionResult | null {
  const days = Object.keys(sessions.results)
    .filter(d => d <= before)
    .sort()
    .reverse();
  for (const d of days) {
    const found = Object.values(sessions.results[d])
      .filter(r => r.note && (!taskId || r.taskId === taskId))
      .sort((a, b) => b.endedAt.localeCompare(a.endedAt))[0];
    if (found) {
      return found;
    }
  }
  return null;
}
