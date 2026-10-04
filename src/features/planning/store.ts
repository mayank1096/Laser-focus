import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ClockTime,
  DayPlan,
  Id,
  ISODate,
  PlannedSession,
  PlanningRhythm,
  Priority,
  SacrificeSheet,
  SessionSheet,
  SessionSlot,
  SheetLine,
  Task,
  TaskKind,
  TimeWindow,
} from '../../types/models';
import { addDays, daysBetween, startOfWeek } from '../../utils/date';
import { createId } from '../../utils/id';

export const PLANNING_LIMITS = {
  /** The course: no more than three deep sessions a day. */
  slots: { min: 1, max: 3 },
  sessionsPerTask: { min: 1, max: 6 },
  sheetMinutes: { min: 15, max: 240, step: 5 },
  steps: { max: 5 },
  giveUp: { min: 1, max: 5 },
  keep: { min: 1, max: 3 },
  /** The Sacrifice sheet is asked for once the first week is behind you. */
  sacrificeAfterDays: 7,
} as const;

export const SLOT_LENGTHS = [45, 60, 90, 120, 180] as const;

export const SHALLOW_PRESETS = {
  evening: { start: 18 * 60, end: 19 * 60 },
  lunch: { start: 13 * 60, end: 14 * 60 },
} as const satisfies Record<string, TimeWindow>;

/** Common ways a session fails, offered on the inversion question. */
export const DEFAULT_FAILURE_MODES = [
  'Phone on the desk',
  'Starting late',
  'Hunger',
  'Instagram “just once”',
  'TV in the next room',
  'Friends texting',
];

export interface NewTask {
  text: string;
  kind: TaskKind;
  priority: Priority;
  sessionsNeeded: number;
}

interface PlanningData {
  /** True once session times, shallow window and rhythm are chosen. */
  setupDone: boolean;
  /** First day of planning; the Sacrifice sheet is due a week later. */
  startedOn: ISODate | null;
  slots: SessionSlot[];
  shallowWindow: TimeWindow;
  rhythm: PlanningRhythm;
  tasks: Task[];
  days: Record<ISODate, DayPlan>;
  /** Failure modes the user wrote themselves, offered again next time. */
  customFailureModes: string[];
  sacrifice: SacrificeSheet | null;
}

interface PlanningActions {
  /** Adds a session time after the last one. False at the limit. */
  addSlot: () => boolean;
  updateSlot: (id: Id, patch: Partial<Omit<SessionSlot, 'id'>>) => void;
  removeSlot: (id: Id) => void;
  setShallowWindow: (window: TimeWindow) => void;
  setRhythm: (patch: Partial<PlanningRhythm>) => void;
  completeSetup: (today: ISODate) => void;

  addTask: (task: NewTask, today: ISODate) => Id;
  updateTask: (id: Id, patch: Partial<NewTask>) => void;
  removeTask: (id: Id) => void;
  /** Ticks a shallow task on or off. */
  toggleShallow: (id: Id) => void;

  /** Gives a session one task. Changing the task discards its sheet. */
  assignTask: (date: ISODate, slotId: Id, taskId: Id | null) => void;
  saveSheet: (date: ISODate, slotId: Id, sheet: SessionSheet) => void;
  /** Seals a day once every planned session has a sheet. */
  sealDay: (date: ISODate, at: string) => boolean;
  addFailureMode: (text: string) => void;

  saveSacrifice: (giveUp: SheetLine[], keep: SheetLine[], at: string) => void;
  reset: () => void;
}

export type PlanningState = PlanningData & PlanningActions;

const initialData: PlanningData = {
  setupDone: false,
  startedOn: null,
  // Sensible first suggestion; most people start with two.
  slots: [
    { id: 'slot_morning', start: 6 * 60, minutes: 90 },
    { id: 'slot_afternoon', start: 14 * 60, minutes: 90 },
  ],
  shallowWindow: SHALLOW_PRESETS.evening,
  rhythm: { weeklyDay: 0, weeklyAt: 19 * 60, nightlyAt: 21 * 60 + 30 },
  tasks: [],
  days: {},
  customFailureModes: [],
  sacrifice: null,
};

const byStart = (a: SessionSlot, b: SessionSlot) => a.start - b.start;
const clampClock = (m: ClockTime) => Math.min(23 * 60 + 45, Math.max(0, m));

function emptyDay(date: ISODate): DayPlan {
  return { date, sessions: [], sealedAt: null };
}

/** Returns the day with one session replaced (or added), unsealed. */
function withSession(
  day: DayPlan,
  slotId: Id,
  update: (current: PlannedSession) => PlannedSession,
): DayPlan {
  const current = day.sessions.find(s => s.slotId === slotId) ?? {
    slotId,
    taskId: null,
    sheet: null,
  };
  const next = update(current);
  return {
    ...day,
    // Any change re-opens the day; it has to be sealed again.
    sealedAt: null,
    sessions: [...day.sessions.filter(s => s.slotId !== slotId), next],
  };
}

export const usePlanning = create<PlanningState>()(
  persist(
    (set, get) => ({
      ...initialData,

      addSlot: () => {
        const { slots } = get();
        if (slots.length >= PLANNING_LIMITS.slots.max) {
          return false;
        }
        const last = [...slots].sort(byStart).at(-1);
        // An hour's rest after the last session, or early evening.
        const start = last
          ? clampClock(Math.ceil((last.start + last.minutes + 60) / 30) * 30)
          : 6 * 60;
        set({
          slots: [...slots, { id: createId('slot'), start, minutes: 90 }].sort(
            byStart,
          ),
        });
        return true;
      },

      updateSlot: (id, patch) =>
        set(state => ({
          slots: state.slots
            .map(s => (s.id === id ? { ...s, ...patch } : s))
            .sort(byStart),
        })),

      removeSlot: id =>
        set(state =>
          state.slots.length <= PLANNING_LIMITS.slots.min
            ? state
            : { slots: state.slots.filter(s => s.id !== id) },
        ),

      setShallowWindow: shallowWindow => set({ shallowWindow }),

      setRhythm: patch =>
        set(state => ({ rhythm: { ...state.rhythm, ...patch } })),

      completeSetup: today =>
        set(state => ({
          setupDone: true,
          startedOn: state.startedOn ?? today,
        })),

      addTask: (task, today) => {
        const id = createId('task');
        set(state => ({
          tasks: [
            ...state.tasks,
            {
              id,
              text: task.text.trim(),
              kind: task.kind,
              priority: task.priority,
              sessionsNeeded: task.kind === 'deep' ? task.sessionsNeeded : 1,
              sessionsDone: 0,
              weekOf: startOfWeek(today),
            },
          ],
        }));
        return id;
      },

      updateTask: (id, patch) =>
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === id
              ? {
                  ...t,
                  ...patch,
                  text: patch.text?.trim() ?? t.text,
                  sessionsNeeded:
                    (patch.kind ?? t.kind) === 'deep'
                      ? patch.sessionsNeeded ?? t.sessionsNeeded
                      : 1,
                }
              : t,
          ),
        })),

      removeTask: id =>
        set(state => {
          const days: Record<ISODate, DayPlan> = {};
          for (const [date, day] of Object.entries(state.days)) {
            const touched = day.sessions.some(s => s.taskId === id);
            days[date] = touched
              ? {
                  ...day,
                  sealedAt: null,
                  sessions: day.sessions.map(s =>
                    s.taskId === id ? { ...s, taskId: null, sheet: null } : s,
                  ),
                }
              : day;
          }
          return { tasks: state.tasks.filter(t => t.id !== id), days };
        }),

      toggleShallow: id =>
        set(state => ({
          tasks: state.tasks.map(t =>
            t.id === id && t.kind === 'shallow'
              ? { ...t, sessionsDone: t.sessionsDone ? 0 : 1 }
              : t,
          ),
        })),

      assignTask: (date, slotId, taskId) =>
        set(state => {
          const day = state.days[date] ?? emptyDay(date);
          const current = day.sessions.find(s => s.slotId === slotId);
          if (current && current.taskId === taskId) {
            return state;
          }
          return {
            days: {
              ...state.days,
              [date]: withSession(day, slotId, s => ({
                ...s,
                taskId,
                sheet: null,
              })),
            },
          };
        }),

      saveSheet: (date, slotId, sheet) =>
        set(state => ({
          days: {
            ...state.days,
            [date]: withSession(
              state.days[date] ?? emptyDay(date),
              slotId,
              s => ({ ...s, sheet }),
            ),
          },
        })),

      sealDay: (date, at) => {
        const plan = planFor(get(), date);
        if (!isReadyToSeal(plan)) {
          return false;
        }
        set(state => ({
          days: {
            ...state.days,
            [date]: { ...(state.days[date] ?? emptyDay(date)), sealedAt: at },
          },
        }));
        return true;
      },

      addFailureMode: text => {
        const clean = text.trim();
        if (!clean) {
          return;
        }
        set(state =>
          [...DEFAULT_FAILURE_MODES, ...state.customFailureModes].includes(
            clean,
          )
            ? state
            : { customFailureModes: [...state.customFailureModes, clean] },
        );
      },

      saveSacrifice: (giveUp, keep, at) =>
        set({ sacrifice: { giveUp, keep, writtenAt: at } }),

      reset: () => set(initialData),
    }),
    {
      name: 'laser-focus/planning',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({
        setupDone,
        startedOn,
        slots,
        shallowWindow,
        rhythm,
        tasks,
        days,
        customFailureModes,
        sacrifice,
      }): PlanningData => ({
        setupDone,
        startedOn,
        slots,
        shallowWindow,
        rhythm,
        tasks,
        days,
        customFailureModes,
        sacrifice,
      }),
    },
  ),
);

/* ------------------------------------------------------------------------ */
/* Selectors: pure functions of the state, so screens and tests share them.  */
/* ------------------------------------------------------------------------ */

export interface SessionView {
  slot: SessionSlot;
  task: Task | null;
  sheet: SessionSheet | null;
}

export interface DayView {
  date: ISODate;
  sessions: SessionView[];
  sealedAt: string | null;
}

/** A day laid over today's session times, earliest first. */
export function planFor(state: PlanningData, date: ISODate): DayView {
  const day = state.days[date];
  return {
    date,
    sealedAt: day?.sealedAt ?? null,
    sessions: [...state.slots].sort(byStart).map(slot => {
      const planned = day?.sessions.find(s => s.slotId === slot.id);
      return {
        slot,
        task: state.tasks.find(t => t.id === planned?.taskId) ?? null,
        sheet: planned?.sheet ?? null,
      };
    }),
  };
}

/** At least one session has a task, and every session with one has a sheet. */
export function isReadyToSeal(day: DayView): boolean {
  const planned = day.sessions.filter(s => s.task);
  return planned.length > 0 && planned.every(s => s.sheet);
}

export function isTaskDone(task: Task): boolean {
  return task.sessionsDone >= task.sessionsNeeded;
}

/**
 * This week's list: everything added this week, plus anything unfinished
 * carried over from earlier weeks. Open work first, by priority.
 */
export function tasksForWeek(state: PlanningData, today: ISODate): Task[] {
  const week = startOfWeek(today);
  return state.tasks
    .filter(t => t.weekOf === week || (t.weekOf < week && !isTaskDone(t)))
    .sort((a, b) => {
      const done = Number(isTaskDone(a)) - Number(isTaskDone(b));
      return done || b.priority - a.priority;
    });
}

/**
 * The most recent sheet written before `date` — for the same task when one
 * exists — so the next sheet can be one step harder.
 */
export function lastSheetBefore(
  state: PlanningData,
  date: ISODate,
  taskId: Id | null,
): SessionSheet | null {
  const earlier = Object.keys(state.days)
    .filter(d => d < date)
    .sort()
    .reverse();
  let fallback: SessionSheet | null = null;
  for (const d of earlier) {
    for (const s of state.days[d].sessions) {
      if (!s.sheet) {
        continue;
      }
      if (taskId && s.taskId === taskId) {
        return s.sheet;
      }
      fallback = fallback ?? s.sheet;
    }
  }
  return fallback;
}

/** Ask for the Sacrifice sheet once, after the first full week. */
export function isSacrificeDue(state: PlanningData, today: ISODate): boolean {
  return (
    state.setupDone &&
    state.sacrifice === null &&
    state.startedOn !== null &&
    daysBetween(state.startedOn, today) >= PLANNING_LIMITS.sacrificeAfterDays
  );
}

export const tomorrowOf = (today: ISODate) => addDays(today, 1);

/** The first session that starts before the one above it ends, if any. */
export function findClash(
  slots: SessionSlot[],
): { earlier: SessionSlot; later: SessionSlot } | null {
  const sorted = [...slots].sort(byStart);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].start < sorted[i - 1].start + sorted[i - 1].minutes) {
      return { earlier: sorted[i - 1], later: sorted[i] };
    }
  }
  return null;
}

/** True when the shallow window overlaps a deep session. */
export function shallowClashes(
  window: TimeWindow,
  slots: SessionSlot[],
): boolean {
  return slots.some(
    s => window.start < s.start + s.minutes && s.start < window.end,
  );
}
