/**
 * Core data shapes for the Laser Focus method.
 *
 * Life > Values > Goals > Milestones > Tasks > Focused Sessions
 *
 * These are the types the backend should mirror. IDs are client-generated
 * strings for now; swap for server IDs once the API exists.
 */

export type Id = string;

/** A single line written on one of the sheets (Values, Anti-goals, …). */
export interface SheetLine {
  id: Id;
  text: string;
}

/** "What do you want said about you when you die?" — written in past tense. */
export type Value = SheetLine;

/** A regret you will face if you do not work with focus. */
export type AntiGoal = SheetLine;

export interface Goal extends SheetLine {
  /** The "Magic Circle" goal — the one that unlocks the others. */
  isPrimary: boolean;
}

/**
 * How the work toward a goal is shaped.
 * - `repeated`: the same action many times (mock tests, videos, gym sessions).
 * - `stages`: different work in sequence (launch a brand, finish a syllabus).
 */
export type WorkShape = 'repeated' | 'stages';

export interface Milestone extends SheetLine {
  /** Target month as an ISO `YYYY-MM` string. */
  dueMonth: string;
  /** True once the user picked the month; otherwise it follows the deadline. */
  monthPinned?: boolean;
}

/** Everything collected by the goal-setup onboarding. */
export interface GoalPlan {
  values: Value[];
  goals: Goal[];
  /** The action you control that produces the primary goal's result. */
  action: string;
  workShape: WorkShape;
  /** Only meaningful when `workShape` is `repeated`. */
  targetCount: number | null;
  /** Months from today to the goal deadline. */
  deadlineMonths: number;
  milestones: Milestone[];
  antiGoals: AntiGoal[];
}

/* ------------------------------------------------------------------------ */
/* Planning: Tasks > Focused Sessions                                        */
/* ------------------------------------------------------------------------ */

/** Local calendar day as an ISO `YYYY-MM-DD` string. */
export type ISODate = string;

/** Minutes after midnight, e.g. 6:30 AM = 390. */
export type ClockTime = number;

/**
 * - `deep`: needs one or more focused sessions.
 * - `shallow`: small things (calls, payments) done in the shallow window.
 */
export type TaskKind = 'deep' | 'shallow';

/** 3 = high, 1 = low. Drawn as ●●● / ●●○ / ●○○. */
export type Priority = 1 | 2 | 3;

export interface Task {
  id: Id;
  text: string;
  kind: TaskKind;
  priority: Priority;
  /** Focused sessions this task needs. Always 1 for shallow tasks. */
  sessionsNeeded: number;
  /** Deep tasks: sessions done. Shallow tasks: 1 once ticked off. */
  sessionsDone: number;
  /** Monday of the week the task belongs to. */
  weekOf: ISODate;
}

/** A fixed daily time for deep work. At most three a day. */
export interface SessionSlot {
  id: Id;
  start: ClockTime;
  /** Planned length in minutes. */
  minutes: number;
  /** What the user calls it, e.g. "Mock test". Falls back to the time of day. */
  name?: string;
}

/** The one-hour window for shallow tasks. */
export interface TimeWindow {
  start: ClockTime;
  end: ClockTime;
}

/** When the user plans: the week once, then each next day. */
export interface PlanningRhythm {
  /** 0 = Sunday … 6 = Saturday, matching `Date.getDay()`. */
  weeklyDay: number;
  weeklyAt: ClockTime;
  nightlyAt: ClockTime;
}

/** Written the night before a session. No sheet, no session. */
export interface SessionSheet {
  /** What will be finished when the session ends. */
  outcome: string;
  /** How this is one step harder than last time. */
  challenge: string;
  challengeKind?: 'faster' | 'better' | 'harder';
  /** How the work will be done. */
  steps: SheetLine[];
  /** Planned length in minutes. */
  minutes: number;
  /** What would guarantee failure, so it can be seen coming. */
  failureModes: string[];
}

export interface PlannedSession {
  slotId: Id;
  taskId: Id | null;
  sheet: SessionSheet | null;
}

export interface DayPlan {
  date: ISODate;
  sessions: PlannedSession[];
  /** Set once the user holds to seal the day; ISO timestamp. */
  sealedAt: string | null;
}

/** Written after the first week: what goes, and what stays no matter what. */
export interface SacrificeSheet {
  giveUp: SheetLine[];
  keep: SheetLine[];
  writtenAt: string;
}
