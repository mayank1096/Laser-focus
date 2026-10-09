import type { ISODate } from '../types/models';
import { addDays, daysBetween } from '../utils/date';
import { weekReviewDate, weekStart } from './days';
import type { BookData, Mark, Session, SetupStep } from './model';

/** Sessions of one day, in order. */
export const sessionsOn = (book: Pick<BookData, 'sessions'>, date: ISODate) =>
  book.sessions.filter(s => s.date === date).sort((a, b) => a.order - b.order);

/**
 * A day's box: ● only when every session that day is ●, zig-zag when any
 * session reached the minimum, empty otherwise. Null when nothing was
 * planned (a rest day, or before the first session).
 */
export function dayMark(
  book: Pick<BookData, 'sessions'>,
  date: ISODate,
): Mark | null {
  const day = sessionsOn(book, date);
  if (!day.length) {
    return null;
  }
  if (day.every(s => s.mark === 'full')) {
    return 'full';
  }
  if (day.some(s => s.mark === 'full' || s.mark === 'half')) {
    return 'half';
  }
  return day.some(s => s.mark) ? 'empty' : null;
}

export const activeMilestones = (
  book: Pick<BookData, 'milestones' | 'circledGoalId'>,
) =>
  book.milestones.filter(m => m.goalId === book.circledGoalId && !m.archived);

/** Today's running session. One started on an earlier day waits for its mark. */
export const inProgress = (book: Pick<BookData, 'sessions'>, today: ISODate) =>
  book.sessions.find(s => s.date === today && s.startedAt && !s.mark) ?? null;

/** The most recent past session still waiting for its mark. */
export const pendingMark = (
  book: Pick<BookData, 'sessions'>,
  today: ISODate,
): Session | null =>
  book.sessions
    .filter(s => s.date < today && !s.mark)
    .sort((a, b) =>
      a.date === b.date ? a.order - b.order : a.date < b.date ? 1 : -1,
    )[0] ?? null;

/** Due when this week's review day has come, or last week's was skipped. */
export function reviewDue(book: BookData, today: ISODate): ISODate | null {
  const thisWeek = weekStart(today, book.rhythm.reviewDay);
  const done = (week: ISODate) => book.reviews.some(r => r.week === week);
  const lastWeek = addDays(thisWeek, -7);
  const hadLastWeek = book.sessions.some(
    s => s.date >= lastWeek && s.date < thisWeek,
  );
  if (hadLastWeek && !done(lastWeek)) {
    return lastWeek;
  }
  const hadThisWeek = book.sessions.some(s => s.date >= thisWeek);
  if (
    today === weekReviewDate(today, book.rhythm.reviewDay) &&
    hadThisWeek &&
    !done(thisWeek)
  ) {
    return thisWeek;
  }
  return null;
}

/** Days since the last session that was started or marked. */
export function daysAway(book: Pick<BookData, 'sessions'>, today: ISODate) {
  const touched = book.sessions
    .filter(s => s.startedAt || s.mark === 'full' || s.mark === 'half')
    .map(s => s.date)
    .sort();
  const last = touched[touched.length - 1];
  return last ? daysBetween(last, today) : 0;
}

export type HomeAction =
  | { kind: 'setup'; step: SetupStep }
  | { kind: 'resting'; until: ISODate }
  | { kind: 'reassess' }
  | { kind: 'inProgress'; session: Session }
  | { kind: 'markPast'; session: Session }
  | { kind: 'finishGoal' }
  | { kind: 'review'; week: ISODate }
  | { kind: 'reread' }
  | { kind: 'start'; session: Session; index: number; count: number }
  | { kind: 'tomorrow'; session: Session }
  | { kind: 'plan'; date: ISODate };

/**
 * The one thing Home offers, highest precedence first. No time-of-day
 * logic beyond the 3 AM day boundary and whether the focus slot has passed.
 */
export function homeAction(
  book: BookData & { rereadOn?: ISODate | null },
  today: ISODate,
  minutesNow: number,
): HomeAction {
  if (book.setup !== 'done') {
    return { kind: 'setup', step: book.setup };
  }
  if (book.restUntil) {
    return today <= book.restUntil
      ? { kind: 'resting', until: book.restUntil }
      : { kind: 'reassess' };
  }
  if (book.reassessing) {
    return { kind: 'reassess' };
  }
  const running = inProgress(book, today);
  if (running) {
    return { kind: 'inProgress', session: running };
  }
  const pending = pendingMark(book, today);
  if (pending) {
    return { kind: 'markPast', session: pending };
  }
  const ms = activeMilestones(book);
  if (ms.length && ms.every(m => m.done)) {
    return { kind: 'finishGoal' };
  }
  const week = reviewDue(book, today);
  if (week) {
    return { kind: 'review', week };
  }
  if (daysAway(book, today) >= 7 && book.rereadOn !== today) {
    return { kind: 'reread' };
  }
  const todays = sessionsOn(book, today);
  const next = todays.findIndex(s => !s.startedAt && !s.mark);
  if (next !== -1) {
    return {
      kind: 'start',
      session: todays[next],
      index: next,
      count: todays.length,
    };
  }
  const tomorrow = addDays(today, 1);
  const first = sessionsOn(book, tomorrow)[0];
  if (first) {
    return { kind: 'tomorrow', session: first };
  }
  return { kind: 'plan', date: planDateFor(book, today, minutesNow) };
}

/** Today if nothing is planned yet and the focus slot is still ahead. */
export function planDateFor(
  book: Pick<BookData, 'sessions' | 'rhythm'>,
  today: ISODate,
  minutesNow: number,
): ISODate {
  const slotAhead = minutesNow < book.rhythm.focusStart;
  return slotAhead && !sessionsOn(book, today).length
    ? today
    : addDays(today, 1);
}

/** Where the circled goal's run stands: day N of its term, and what is left. */
export function sprintProgress(
  book: Pick<
    BookData,
    'goals' | 'circledGoalId' | 'sprintStart' | 'milestones'
  >,
  today: ISODate,
) {
  const goal = book.goals.find(g => g.id === book.circledGoalId) ?? null;
  const start = book.sprintStart ?? today;
  const days = Math.round((goal?.term ?? 1) * 365);
  const day = Math.max(1, daysBetween(start, today) + 1);
  const left = Math.max(0, days - day + 1);
  const months = Math.floor(left / 30.4);
  const ms = activeMilestones(book);
  return {
    goal,
    start,
    day,
    days,
    left,
    monthsLeft: months,
    daysLeft: Math.round(left - months * 30.4),
    milestonesDone: ms.filter(m => m.done).length,
    milestonesTotal: ms.length,
  };
}
