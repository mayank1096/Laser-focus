import { useGoalSetup } from '../src/features/onboarding/store';
import { usePlanning } from '../src/features/planning/store';
import { dayMark, streak, useSessions } from '../src/features/session/store';

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m);
const iso = (d: number) => `2026-10-${String(d).padStart(2, '0')}`;

function plan(day: number) {
  const id = usePlanning
    .getState()
    .addTask(
      { text: `Task ${day}`, kind: 'deep', priority: 2, sessionsNeeded: 1 },
      iso(day),
    );
  usePlanning.getState().assignTask(iso(day), 'slot_morning', id);
  return id;
}

function sit(day: number, minutes: number, planned = 90) {
  useSessions.getState().start(
    {
      date: iso(day),
      slotId: 'slot_morning',
      taskId: null,
      minutes: planned,
    },
    at(day, 6),
  );
  const done = minutes >= planned;
  return useSessions
    .getState()
    .end(at(day, 6, minutes), done ? undefined : { reason: 'test' });
}

describe('session marks and streaks', () => {
  beforeEach(() => {
    useSessions.getState().reset();
    usePlanning.getState().reset();
  });

  it('gives full, half and missed marks', () => {
    plan(1);
    plan(2);
    plan(3);
    sit(1, 90);
    sit(2, 12);
    const s = useSessions.getState();
    const p = usePlanning.getState();
    expect(dayMark(s, p, iso(1), iso(4))).toBe('full');
    expect(dayMark(s, p, iso(2), iso(4))).toBe('half');
    expect(dayMark(s, p, iso(3), iso(4))).toBe('missed');
    expect(dayMark(s, p, iso(5), iso(5))).toBe('empty');
  });

  it('counts the streak back from today, or from yesterday while today is open', () => {
    for (const d of [1, 2, 3, 4]) {
      plan(d);
    }
    sit(1, 90);
    sit(2, 90);
    sit(3, 20);
    const s = useSessions.getState();
    const p = usePlanning.getState();
    // Day 4 is still pending: the streak counts 3, 2, 1.
    expect(streak(s, p, iso(4))).toBe(3);
    sit(4, 4);
    // Under ten minutes on day 4 and the day is over → still pending today.
    expect(streak(useSessions.getState(), p, iso(4))).toBe(3);
    expect(streak(useSessions.getState(), p, iso(5))).toBe(0);
  });

  it('caps an early end at the minutes actually sat', () => {
    plan(1);
    const r = sit(1, 25);
    expect(r).toMatchObject({
      minutes: 25,
      endedEarly: true,
      plannedMinutes: 90,
    });
    expect(useSessions.getState().active).toBeNull();
  });
});

describe('switching the Magic Circle goal', () => {
  beforeEach(() => {
    useGoalSetup.getState().reset();
    useGoalSetup.setState({
      goals: [
        { id: 'a', text: 'Clear CA', isPrimary: true },
        { id: 'b', text: 'Earn ₹50,000', isPrimary: false },
      ],
      action: 'Attempt a mock test',
      workShape: 'repeated',
      targetCount: 50,
      completed: true,
    });
  });

  it('pauses the current plan and asks for a new one', () => {
    const needsPlan = useGoalSetup
      .getState()
      .switchGoal('b', 'Exam moved', 'now');
    const s = useGoalSetup.getState();
    expect(needsPlan).toBe(true);
    expect(s.goals.find(g => g.isPrimary)?.id).toBe('b');
    expect(s.paused.a).toMatchObject({
      action: 'Attempt a mock test',
      targetCount: 50,
    });
    expect(s).toMatchObject({ action: '', completed: false, stepId: 'action' });
    expect(s.switches).toEqual([
      { from: 'a', to: 'b', reason: 'Exam moved', at: 'now' },
    ]);
  });

  it('resumes a paused goal without planning it again', () => {
    useGoalSetup.getState().switchGoal('b', 'x', 'now');
    useGoalSetup.setState({ action: 'Pitch a client', completed: true });
    const needsPlan = useGoalSetup.getState().switchGoal('a', 'back', 'later');
    const s = useGoalSetup.getState();
    expect(needsPlan).toBe(false);
    expect(s).toMatchObject({ action: 'Attempt a mock test', completed: true });
    expect(s.paused.b).toMatchObject({ action: 'Pitch a client' });
    expect(s.paused.a).toBeUndefined();
  });
});
