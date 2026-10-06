import type { ISODate } from '../types/models';
import { addDays, daysBetween, fromISODate, toISODate } from '../utils/date';
import { countableNoun } from '../utils/text';
import { useGoalSetup } from './onboarding/store';
import { isTaskDone, usePlanning } from './planning/store';
import { dayMark, streak, useSessions, type DayMark } from './session/store';
import { today as todayISO } from '../utils/clock';

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

export interface GoalProgress {
  goal: string;
  /** Units of the action done, e.g. mock tests finished. */
  done: number;
  total: number;
  /** "mock tests", or "steps" for staged work. */
  noun: string;
  monthsLeft: number;
  /** "Jun 2027" */
  deadline: string;
  /** Day number since planning began, and the length of the whole run. */
  day: number;
  days: number;
}

/** Where the Magic Circle goal stands, from the sheets and finished work. */
export function useGoalProgress(): GoalProgress {
  const g = useGoalSetup();
  const planning = usePlanning();
  const today = todayISO();
  const goal = g.goals.find(x => x.isPrimary)?.text ?? 'Your goal';
  const repeated = g.workShape === 'repeated';
  const finished = planning.tasks.filter(
    t => t.kind === 'deep' && isTaskDone(t),
  ).length;
  const start =
    planning.startedOn ??
    (g.completedAt ? toISODate(new Date(g.completedAt)) : today);
  const end = fromISODate(start);
  end.setMonth(end.getMonth() + g.deadlineMonths);
  const endISO = toISODate(end);
  return {
    goal,
    done: repeated
      ? Math.min(finished, g.targetCount)
      : Math.min(finished, g.milestones.length),
    total: repeated ? g.targetCount : Math.max(1, g.milestones.length),
    noun: repeated ? countableNoun(g.action) : 'steps',
    monthsLeft: Math.max(0, Math.round(daysBetween(today, endISO) / 30.4)),
    deadline: `${MONTHS[end.getMonth()]} ${end.getFullYear()}`,
    day: Math.max(1, daysBetween(start, today) + 1),
    days: Math.max(1, daysBetween(start, endISO)),
  };
}

/** The last `count` days' marks, oldest first, ending today. */
export function useRecentMarks(
  count: number,
): { date: ISODate; mark: DayMark }[] {
  const sessions = useSessions();
  const planning = usePlanning();
  const today = todayISO();
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(today, i - count + 1);
    return { date, mark: dayMark(sessions, planning, date, today) };
  });
}

export function useStreak(): number {
  const sessions = useSessions();
  const planning = usePlanning();
  return streak(sessions, planning, todayISO());
}

/** How many units each milestone covers when the work is repeated. */
export function milestoneSizes(total: number, count: number): number[] {
  const size = Math.ceil(total / Math.max(1, count));
  return Array.from({ length: count }, (_, i) =>
    Math.max(0, Math.min(size, total - i * size)),
  );
}

export interface MilestoneRow {
  id: string;
  text: string;
  dueMonth?: string;
  size: number;
  done: number;
}

/** Each milestone with its share of the work done; `current` is the open one. */
export function useMilestoneRows(): { rows: MilestoneRow[]; current: number } {
  const g = useGoalSetup();
  const progress = useGoalProgress();
  const repeated = g.workShape === 'repeated';
  const sizes = milestoneSizes(g.targetCount, g.milestones.length);
  let before = 0;
  const rows = g.milestones.map((m, i) => {
    const size = repeated ? sizes[i] : 1;
    const done = Math.max(0, Math.min(size, progress.done - before));
    before += size;
    return { id: m.id, text: m.text, dueMonth: m.dueMonth, size, done };
  });
  return { rows, current: rows.findIndex(r => r.done < r.size) };
}
