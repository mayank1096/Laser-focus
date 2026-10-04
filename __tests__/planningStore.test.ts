import {
  findClash,
  isReadyToSeal,
  isSacrificeDue,
  lastSheetBefore,
  planFor,
  shallowClashes,
  tasksForWeek,
  usePlanning,
} from '../src/features/planning/store';
import type { SessionSheet } from '../src/types/models';

const TODAY = '2026-10-04'; // a Sunday; the week began Mon 28 Sep
const TOMORROW = '2026-10-05';

const sheet = (outcome: string): SessionSheet => ({
  outcome,
  challenge: 'Finish in 3 hours',
  steps: [{ id: 's1', text: 'Phone in the other room' }],
  minutes: 180,
  failureModes: ['Phone on the desk'],
});

const store = () => usePlanning.getState();
const deep = (text: string, sessionsNeeded = 1) =>
  store().addTask({ text, kind: 'deep', priority: 2, sessionsNeeded }, TODAY);

describe('planning store', () => {
  beforeEach(() => store().reset());

  it('allows three sessions a day at most, and at least one', () => {
    expect(store().slots).toHaveLength(2);
    expect(store().addSlot()).toBe(true);
    expect(store().addSlot()).toBe(false);
    expect(store().slots).toHaveLength(3);
    // The new session starts an hour after the last one ends.
    expect(store().slots[2].start).toBe(14 * 60 + 90 + 60);

    for (const slot of [...store().slots]) {
      store().removeSlot(slot.id);
    }
    expect(store().slots).toHaveLength(1);
  });

  it('keeps sessions in time order and spots clashes', () => {
    const [morning, afternoon] = store().slots;
    store().updateSlot(afternoon.id, { start: 4 * 60 });
    expect(store().slots[0].id).toBe(afternoon.id);
    expect(findClash(store().slots)).toBeNull();

    store().updateSlot(morning.id, { start: 5 * 60 });
    expect(findClash(store().slots)).toMatchObject({
      earlier: { id: afternoon.id },
      later: { id: morning.id },
    });
  });

  it('notices a shallow window inside a deep session', () => {
    expect(shallowClashes(store().shallowWindow, store().slots)).toBe(false);
    expect(
      shallowClashes({ start: 6 * 60 + 30, end: 7 * 60 + 30 }, store().slots),
    ).toBe(true);
  });

  it('files tasks under the week they were added', () => {
    const id = store().addTask(
      {
        text: '  Pay exam fee ',
        kind: 'shallow',
        priority: 1,
        sessionsNeeded: 4,
      },
      TODAY,
    );
    expect(store().tasks.find(t => t.id === id)).toMatchObject({
      text: 'Pay exam fee',
      weekOf: '2026-09-28',
      // Shallow work never needs a session.
      sessionsNeeded: 1,
    });
  });

  it('carries unfinished work into the next week, open work first', () => {
    const low = store().addTask(
      { text: 'Low', kind: 'deep', priority: 1, sessionsNeeded: 1 },
      TODAY,
    );
    const high = store().addTask(
      { text: 'High', kind: 'deep', priority: 3, sessionsNeeded: 1 },
      TODAY,
    );
    const done = deep('Done');
    usePlanning.setState(s => ({
      tasks: s.tasks.map(t => (t.id === done ? { ...t, sessionsDone: 1 } : t)),
    }));

    expect(tasksForWeek(store(), TODAY).map(t => t.id)).toEqual([
      high,
      low,
      done,
    ]);
    // Next week: the finished task stays behind.
    expect(tasksForWeek(store(), '2026-10-06').map(t => t.id)).toEqual([
      high,
      low,
    ]);
  });

  it('seals a day only when every planned session has a sheet', () => {
    const [morning, afternoon] = store().slots;
    const a = deep('Mock 23');
    const b = deep('Mock 24');

    expect(store().sealDay(TOMORROW, 'now')).toBe(false); // nothing planned

    store().assignTask(TOMORROW, morning.id, a);
    store().assignTask(TOMORROW, afternoon.id, b);
    store().saveSheet(TOMORROW, morning.id, sheet('Paper 1'));
    expect(isReadyToSeal(planFor(store(), TOMORROW))).toBe(false);
    expect(store().sealDay(TOMORROW, 'now')).toBe(false);

    store().saveSheet(TOMORROW, afternoon.id, sheet('Paper 2'));
    expect(store().sealDay(TOMORROW, 'now')).toBe(true);
    expect(planFor(store(), TOMORROW).sealedAt).toBe('now');

    // Changing a session's task throws its sheet away and re-opens the day.
    store().assignTask(TOMORROW, afternoon.id, a);
    const day = planFor(store(), TOMORROW);
    expect(day.sealedAt).toBeNull();
    expect(day.sessions[1].sheet).toBeNull();
  });

  it('clears a removed task from every plan', () => {
    const [morning] = store().slots;
    const a = deep('Mock 23');
    store().assignTask(TOMORROW, morning.id, a);
    store().saveSheet(TOMORROW, morning.id, sheet('Paper 1'));
    store().removeTask(a);
    expect(planFor(store(), TOMORROW).sessions[0]).toMatchObject({
      task: null,
      sheet: null,
    });
  });

  it('finds the sheet to beat, preferring the same task', () => {
    const [morning, afternoon] = store().slots;
    const a = deep('Mock 23');
    const b = deep('Mock 24');
    store().assignTask('2026-10-01', morning.id, a);
    store().saveSheet('2026-10-01', morning.id, sheet('A, Thursday'));
    store().assignTask('2026-10-02', afternoon.id, b);
    store().saveSheet('2026-10-02', afternoon.id, sheet('B, Friday'));

    expect(lastSheetBefore(store(), TODAY, a)?.outcome).toBe('A, Thursday');
    expect(lastSheetBefore(store(), TODAY, null)?.outcome).toBe('B, Friday');
    expect(lastSheetBefore(store(), '2026-10-01', a)).toBeNull();
  });

  it('asks for the Sacrifice sheet once, after the first week', () => {
    store().completeSetup(TODAY);
    expect(isSacrificeDue(store(), '2026-10-10')).toBe(false);
    expect(isSacrificeDue(store(), '2026-10-11')).toBe(true);
    store().saveSacrifice(
      [{ id: 'g', text: 'Instagram' }],
      [{ id: 'k', text: 'Sunday lunch' }],
      'now',
    );
    expect(isSacrificeDue(store(), '2026-10-11')).toBe(false);
  });

  it('remembers failure modes the user wrote, once', () => {
    store().addFailureMode('  Cousin’s wedding prep ');
    store().addFailureMode('Cousin’s wedding prep');
    store().addFailureMode('Hunger'); // already offered
    expect(store().customFailureModes).toEqual(['Cousin’s wedding prep']);
  });
});
