import {
  nextStepIndex,
  previousStepIndex,
  STEPS,
} from '../src/features/onboarding/steps';
import {
  suggestBatchMilestones,
  useGoalSetup,
} from '../src/features/onboarding/store';

const store = () => useGoalSetup.getState();
const indexOf = (id: string) => STEPS.findIndex(s => s.id === id);

beforeEach(() => store().reset());

describe('goal setup store', () => {
  it('makes a single goal the Magic Circle goal automatically', () => {
    store().setGoals([
      { id: 'g1', text: 'Clear CA Foundation', isPrimary: false },
    ]);
    expect(store().goals[0].isPrimary).toBe(true);
  });

  it('keeps exactly one primary goal', () => {
    store().setGoals([
      { id: 'g1', text: 'A', isPrimary: false },
      { id: 'g2', text: 'B', isPrimary: false },
    ]);
    store().setPrimaryGoal('g2');
    expect(
      store()
        .goals.filter(g => g.isPrimary)
        .map(g => g.id),
    ).toEqual(['g2']);
  });

  it('re-dates milestones when the deadline changes', () => {
    store().setMilestones([
      { id: 'm1', text: 'One' },
      { id: 'm2', text: 'Two' },
    ]);
    const before = store().milestones.map(m => m.dueMonth);
    store().setDeadlineMonths(48);
    const after = store().milestones.map(m => m.dueMonth);
    expect(after).not.toEqual(before);
    expect(after[1] > after[0]).toBe(true);
  });

  it('has no plan until the required answers exist', () => {
    expect(store().toPlan()).toBeNull();
    store().setGoals([{ id: 'g1', text: 'A', isPrimary: true }]);
    store().setWorkShape('stages');
    expect(store().toPlan()).toMatchObject({
      workShape: 'stages',
      targetCount: null,
    });
  });
});

describe('step order', () => {
  it('skips the count question for work done in stages', () => {
    store().setWorkShape('stages');
    expect(nextStepIndex(indexOf('workShape'), store())).toBe(
      indexOf('deadline'),
    );
    expect(previousStepIndex(indexOf('deadline'), store())).toBe(
      indexOf('workShape'),
    );
  });

  it('asks the count question for repeated work', () => {
    store().setWorkShape('repeated');
    expect(nextStepIndex(indexOf('workShape'), store())).toBe(indexOf('count'));
  });

  it('ends after the anti-goal sheet', () => {
    expect(nextStepIndex(indexOf('antiGoal'), store())).toBe(-1);
  });
});

describe('suggestBatchMilestones', () => {
  it('splits a count into even batches', () => {
    expect(suggestBatchMilestones('mock tests', 24).map(m => m.text)).toEqual([
      'Mock tests 1–8',
      'Mock tests 9–16',
      'Mock tests 17–24',
    ]);
  });

  it('handles counts smaller than the batch count', () => {
    expect(suggestBatchMilestones('videos', 2).map(m => m.text)).toEqual([
      'Videos 1',
      'Videos 2',
    ]);
  });
});
