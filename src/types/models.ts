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
