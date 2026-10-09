import { appDay, weekStart } from '../src/core/days';
import { dayMark, homeAction, planDateFor } from '../src/core/home';
import { DEFAULT_RHYTHM, type BookData, type Session } from '../src/core/model';

const base: BookData & { rereadOn: string | null } = {
  setup: 'done',
  welcomed: true,
  values: [],
  goals: [{ id: 'g1', text: 'Clear CA', term: 2 }],
  circledGoalId: 'g1',
  milestones: [
    { id: 'm1', goalId: 'g1', text: 'Mocks 1–10', done: false },
    { id: 'm2', goalId: 'g1', text: 'Mocks 11–20', done: false },
  ],
  tasks: [],
  rhythm: DEFAULT_RHYTHM,
  sessions: [],
  reviews: [],
  restUntil: null,
  reassessing: false,
  lessons: [],
  antiGoals: [],
  giveUp: [],
  keep: [],
  sprintStart: '2026-10-05',
  rereadOn: null,
};

const s = (p: Partial<Session> & { date: string }): Session => ({
  id: `${p.date}-${p.order ?? 0}`,
  order: 0,
  what: 'Mock 3',
  outcome: 'All 100 questions',
  minutes: 120,
  start: 360,
  ...p,
});

// 2026-10-07 is a Wednesday; the default review day is Sunday.
const WED = '2026-10-07';

describe('days', () => {
  it('turns the day over at 3 AM', () => {
    expect(appDay(new Date(2026, 9, 8, 2, 30))).toBe('2026-10-07');
    expect(appDay(new Date(2026, 9, 8, 3, 0))).toBe('2026-10-08');
  });

  it('starts the week the day after the review day', () => {
    expect(weekStart(WED, 0)).toBe('2026-10-05'); // Monday after Sunday
    expect(weekStart('2026-10-11', 0)).toBe('2026-10-05');
    expect(weekStart(WED, 3)).toBe('2026-10-01'); // review Wed → Thu start
  });
});

describe('dayMark', () => {
  it('is ● only when every session is ●', () => {
    const book = {
      sessions: [
        s({ date: WED, mark: 'full' }),
        s({ date: WED, order: 1, mark: 'half' }),
      ],
    };
    expect(dayMark(book, WED)).toBe('half');
    expect(dayMark({ sessions: [s({ date: WED, mark: 'full' })] }, WED)).toBe(
      'full',
    );
    expect(dayMark({ sessions: [] }, WED)).toBeNull();
  });
});

describe('homeAction', () => {
  it('continues an unfinished setup first', () => {
    expect(homeAction({ ...base, setup: 'milestones' }, WED, 600)).toEqual({
      kind: 'setup',
      step: 'milestones',
    });
  });

  it('shows rest, then reassess once the date passes', () => {
    const resting = { ...base, restUntil: '2026-10-09', reassessing: true };
    expect(homeAction(resting, WED, 600).kind).toBe('resting');
    expect(homeAction(resting, '2026-10-10', 600).kind).toBe('reassess');
  });

  it('asks about yesterday before anything else', () => {
    const book = { ...base, sessions: [s({ date: '2026-10-06' })] };
    expect(homeAction(book, WED, 600).kind).toBe('markPast');
  });

  it('offers the in-progress session', () => {
    const book = {
      ...base,
      sessions: [s({ date: WED, startedAt: '2026-10-07T06:04:00Z' })],
    };
    expect(homeAction(book, WED, 600).kind).toBe('inProgress');
  });

  it('asks for the mark of a session left running yesterday', () => {
    const book = {
      ...base,
      sessions: [s({ date: '2026-10-06', startedAt: '2026-10-06T06:04:00Z' })],
    };
    expect(homeAction(book, WED, 600).kind).toBe('markPast');
  });

  it('starts the next unstarted session of today', () => {
    const book = {
      ...base,
      sessions: [
        s({ date: WED, mark: 'full' }),
        s({ date: WED, order: 1, what: 'Mock 4' }),
      ],
    };
    const a = homeAction(book, WED, 600);
    expect(a).toMatchObject({ kind: 'start', index: 1, count: 2 });
  });

  it('plans tomorrow once today is marked, with no time-of-day logic', () => {
    const book = { ...base, sessions: [s({ date: WED, mark: 'full' })] };
    expect(homeAction(book, WED, 600)).toEqual({
      kind: 'plan',
      date: '2026-10-08',
    });
  });

  it('plans today when nothing is planned and the slot is still ahead', () => {
    expect(planDateFor(base, WED, 300)).toBe(WED);
    expect(planDateFor(base, WED, 400)).toBe('2026-10-08');
  });

  it('shows tomorrow’s first session once planned', () => {
    const book = { ...base, sessions: [s({ date: '2026-10-08' })] };
    expect(homeAction(book, WED, 600).kind).toBe('tomorrow');
  });

  it('finishes the goal when every milestone is ticked', () => {
    const book = {
      ...base,
      milestones: base.milestones.map(m => ({ ...m, done: true })),
    };
    expect(homeAction(book, WED, 600).kind).toBe('finishGoal');
  });

  it('offers the review on review day and keeps offering it when skipped', () => {
    const sunday = '2026-10-11';
    const book = { ...base, sessions: [s({ date: WED, mark: 'full' })] };
    expect(homeAction(book, sunday, 600)).toEqual({
      kind: 'review',
      week: '2026-10-05',
    });
    expect(homeAction(book, '2026-10-13', 600)).toMatchObject({
      kind: 'review',
      week: '2026-10-05',
    });
    const reviewed = {
      ...book,
      reviews: [{ week: '2026-10-05', at: 'x', boreSit: true }],
    };
    expect(homeAction(reviewed, sunday, 600).kind).toBe('plan');
  });

  it('asks to re-read the sheets after a week away', () => {
    const book = {
      ...base,
      sessions: [s({ date: '2026-09-25', mark: 'full' })],
      reviews: [
        { week: '2026-09-21', at: 'x', boreSit: true },
        { week: '2026-09-28', at: 'x', boreSit: true },
      ],
    };
    expect(homeAction(book, WED, 600).kind).toBe('reread');
    expect(homeAction({ ...book, rereadOn: WED }, WED, 600).kind).toBe('plan');
  });
});
