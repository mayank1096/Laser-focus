import type { ClockTime, Id, ISODate, SheetLine } from '../types/models';

/** How far off a goal is, in whole years. */
export type Term = number;
/** Quick picks; any whole number of years in TERM_RANGE works. */
export const TERMS: Term[] = [2, 5, 10, 20];
export const TERM_RANGE = { min: 1, max: 30 } as const;

export interface Goal {
  id: Id;
  text: string;
  term: Term;
  /** Ticked at reassess once it is reached. */
  doneAt?: string;
}

export interface Milestone {
  id: Id;
  goalId: Id;
  text: string;
  /** "YYYY-MM", optional. */
  month?: string;
  done: boolean;
  /** Set when the goal is switched; kept, not deleted. */
  archived?: boolean;
}

export type TaskKind = 'deep' | 'shallow';

export interface WeekTask {
  id: Id;
  text: string;
  kind: TaskKind;
  milestoneId?: Id;
  /** First day of the week this task belongs to. */
  week: ISODate;
  done: boolean;
}

/** Full: the whole outcome · half: at least ten minutes · empty: didn't happen. */
export type Mark = 'full' | 'half' | 'empty';

export interface Session {
  id: Id;
  date: ISODate;
  /** 0-based position in the day. */
  order: number;
  taskId?: Id;
  what: string;
  outcome: string;
  minutes: number;
  /** Planned start; defaults to the focus slot, following earlier sessions. */
  start: ClockTime;
  challenge?: string;
  steps?: string;
  risks?: string;
  dontDo?: string[];
  startedAt?: string;
  mark?: Mark;
  markedAt?: string;
  finished?: string;
  wentWrong?: string[];
}

export interface Rhythm {
  /** When the day's deep work begins; planned sessions line up from here. */
  focusStart: ClockTime;
  /** 0 = Sunday … 6 = Saturday. */
  reviewDay: number;
  reminderOn: boolean;
  reminderAt: ClockTime;
}

export interface Review {
  /** First day of the week reviewed. */
  week: ISODate;
  at: string;
  boreSit: boolean;
}

export interface Lessons {
  repeat: string;
  dont: string;
  at: string;
}

export type SetupStep =
  | 'values'
  | 'goals'
  | 'circle'
  | 'milestones'
  | 'tasks'
  | 'rhythm'
  | 'vow'
  | 'plan'
  | 'done';

export const SETUP_ORDER: SetupStep[] = [
  'values',
  'goals',
  'circle',
  'milestones',
  'tasks',
  'rhythm',
  'vow',
  'plan',
  'done',
];

export const LIMITS = {
  values: { min: 3 },
  goals: { min: 1, max: 5 },
  milestones: { min: 3 },
  deep: { min: 1, max: 5 },
  sessionsPerDay: 3,
} as const;

export const MINUTE_CHIPS = [30, 60, 120, 180];
/** A new session's length until you pick one. */
export const DEFAULT_SESSION_MINUTES = 120;

export interface BookData {
  /** Where an unfinished setup resumes; 'done' once Home is open. */
  setup: SetupStep;
  welcomed: boolean;
  values: SheetLine[];
  goals: Goal[];
  circledGoalId: Id | null;
  milestones: Milestone[];
  tasks: WeekTask[];
  rhythm: Rhythm;
  sessions: Session[];
  reviews: Review[];
  /** Resting until this date (inclusive); null when not resting. */
  restUntil: ISODate | null;
  /** True after rest ends until the next goal is circled. */
  reassessing: boolean;
  lessons: Lessons[];
  antiGoals: SheetLine[];
  giveUp: SheetLine[];
  keep: SheetLine[];
  /** When the circled goal was circled; the sprint calendar starts here. */
  sprintStart: ISODate | null;
}

export const DEFAULT_RHYTHM: Rhythm = {
  focusStart: 6 * 60,
  reviewDay: 0,
  reminderOn: true,
  reminderAt: 21 * 60,
};
