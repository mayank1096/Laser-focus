import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
import { DEFAULT_RHYTHM } from '../src/core/model';
import { en } from '../src/i18n/en';
import { useBook } from '../src/core/store';
import { useProfile } from '../src/features/account/store';
import {
  addLine,
  hold,
  press,
  textContent,
  tick,
  type,
} from '../test/flowHelpers';

jest.useFakeTimers();
jest.setTimeout(20000);

const account = {
  method: 'phone' as const,
  phone: '919876543210',
  signedInAt: 'x',
};
const book = {
  setup: 'done' as const,
  welcomed: true,
  values: [{ id: 'v1', text: 'I never wasted a day' }],
  goals: [
    { id: 'g1', text: 'Earn ₹1 lakh a month', term: 2 as const },
    { id: 'g2', text: 'Run a marathon', term: 5 as const },
  ],
  circledGoalId: 'g1',
  milestones: [
    { id: 'm1', goalId: 'g1', text: '10 clients', done: true },
    { id: 'm2', goalId: 'g1', text: '₹50k month', done: true },
    { id: 'm3', goalId: 'g1', text: '₹1 lakh month', done: false },
  ],
  tasks: [
    {
      id: 't1',
      text: 'Cut 3 client reels',
      kind: 'deep' as const,
      milestoneId: 'm3',
      week: '2026-10-05',
      done: false,
    },
  ],
  rhythm: DEFAULT_RHYTHM,
  sprintStart: '2026-10-05',
};

describe('the daily loop', () => {
  let tree: ReactTestRenderer;
  afterEach(async () => {
    await act(async () => tree.unmount());
  });

  beforeEach(() => {
    useBook.getState().reset();
    useProfile.getState().reset();
    useProfile.setState({ account, pratigya: 'arjun', vowTakenAt: 'x' });
  });

  it('starts, runs and marks a session, then plans tomorrow', async () => {
    jest.setSystemTime(new Date(2026, 9, 7, 6, 0)); // Wednesday
    useBook.setState({
      ...book,
      sessions: [
        {
          id: 's1',
          date: '2026-10-07',
          order: 0,
          taskId: 't1',
          what: 'Cut 3 client reels',
          outcome: 'Reel 1 exported',
          minutes: 60,
          start: 360,
        },
      ],
    });
    await act(async () => {
      tree = create(<App />);
    });
    expect(textContent(tree)).toContain('Start Session 1');
    await press(tree, 'home-action');

    // 13 The ritual: enter, clear the field, breathe, pray, values,
    // tratak, then 3, 2, 1
    expect(textContent(tree)).toContain('Pranam & enter.');
    await press(tree, 'next-button');
    await press(tree, 'next-button'); // locked until every box is ticked
    expect(textContent(tree)).toContain('Only the work in reach.');
    for (const item of en.ritual.checklist.flatMap(g => g.items)) {
      await press(tree, `check-${item}`);
    }
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('Breathe in');
    await press(tree, 'breathe-skip');
    expect(textContent(tree)).toContain('Fold your hands.');
    await press(tree, 'pray-skip');
    expect(textContent(tree)).toContain('Arjuna didn’t lift the bow');
    await tick(1500);
    await hold(tree, 'values-hold');
    expect(textContent(tree)).toContain('Look at your work');
    await press(tree, 'tratak-skip');
    expect(useBook.getState().sessions[0].startedAt).toBeUndefined();
    for (let i = 0; i < 14; i++) {
      await tick(1000);
    }
    expect(useBook.getState().sessions[0].startedAt).toBeDefined();

    // 14 In progress
    jest.setSystemTime(new Date(2026, 9, 7, 6, 4, 59));
    await tick(1000);
    expect(textContent(tree)).toMatch(/\b5\d:\d\d/);
    await press(tree, 'im-done');

    // 15 Mark
    await act(async () => {
      tree.root
        .findAll(
          n => n.props.testID === 'mark-pad' && n.props.onAccessibilityAction,
        )
        .at(-1)!
        .props.onAccessibilityAction({
          nativeEvent: { actionName: 'activate' },
        });
    });
    await type(tree, 'finished', 'Reel 1 and half of reel 2');
    expect(textContent(tree)).toContain('Plan tomorrow');
    await press(tree, 'mark-next');
    expect(useBook.getState().sessions[0]).toMatchObject({
      mark: 'full',
      finished: 'Reel 1 and half of reel 2',
    });

    // 16 The day's last box → 12 Plan tomorrow
    await press(tree, 'pick-0-t1');
    await type(tree, 'outcome-0', 'Reel 2 exported');
    await press(tree, 'plan-save');
    expect(
      useBook.getState().sessions.find(s => s.date === '2026-10-08'),
    ).toMatchObject({
      what: 'Cut 3 client reels',
      outcome: 'Reel 2 exported',
    });
  });

  it('ends a session early on the red screen, as a zig-zag', async () => {
    jest.setSystemTime(new Date(2026, 9, 7, 6, 15));
    useBook.setState({
      ...book,
      sessions: [
        {
          id: 's1',
          date: '2026-10-07',
          order: 0,
          taskId: 't1',
          what: 'Cut 3 client reels',
          outcome: 'Reel 1 exported',
          minutes: 60,
          start: 360,
          startedAt: new Date(2026, 9, 7, 6, 0).toISOString(),
        },
      ],
    });
    await act(async () => {
      tree = create(<App />);
    });
    expect(textContent(tree)).toContain('Steady');
    await act(async () => {
      tree.root
        .findAll(n => n.props.testID === 'in-progress' && n.props.onLongPress)
        .at(-1)!
        .props.onLongPress();
    });
    expect(textContent(tree)).toContain('End early?');
    await press(tree, 'reason-Called away');
    await hold(tree, 'end-hold');
    expect(useBook.getState().sessions[0]).toMatchObject({
      mark: 'half',
      wentWrong: ['Called away'],
    });
    expect(textContent(tree)).toContain('Change');
  });

  it('reviews the week, finishes the goal, rests and circles the next one', async () => {
    jest.setSystemTime(new Date(2026, 9, 11, 20, 0)); // Sunday, review day
    useBook.setState({
      ...book,
      sessions: [
        {
          id: 's1',
          date: '2026-10-08',
          order: 0,
          taskId: 't1',
          what: 'Cut 3 client reels',
          outcome: 'Reel 1',
          minutes: 60,
          start: 360,
          startedAt: 'x',
          mark: 'full',
        },
      ],
    });
    await act(async () => {
      tree = create(<App />);
    });

    // 17 Review
    expect(textContent(tree)).toContain('Review the week');
    await press(tree, 'home-action');
    await press(tree, 'ms-m3');
    await press(tree, 'review-save');
    expect(useBook.getState().reviews).toHaveLength(1);

    // 18 Goal done → 19 Rest
    expect(textContent(tree)).toContain('Goal reached');
    await press(tree, 'rest-now');
    await press(tree, 'rest-3');
    await press(tree, 'rest-go');
    expect(useBook.getState().restUntil).toBe('2026-10-14');
    expect(textContent(tree)).toContain('Resting until');

    // 20 Reassess, after ending rest early
    await press(tree, 'home-extra');
    await type(tree, 'lesson-repeat', 'Plan the night before');
    await press(tree, 'reassess-next');
    expect(useBook.getState().lessons).toHaveLength(1);
    await press(tree, 'circle-g2');
    await press(tree, 'next-button');
    for (const m of ['10 km', 'Half marathon', 'Full marathon']) {
      await addLine(tree, 'milestones-list', m);
    }
    await press(tree, 'next-button');
    await addLine(tree, 'tasks-list', 'Run 5 km three times');
    await press(tree, 'next-button');

    // Back to Plan, then Home
    await press(tree, 'pick-0-other');
    await type(tree, 'what-0', 'Run 5 km');
    await type(tree, 'outcome-0', 'Under 35 minutes');
    await press(tree, 'plan-save');
    const s = useBook.getState();
    expect(s.circledGoalId).toBe('g2');
    expect(s.reassessing).toBe(false);
    expect(s.restUntil).toBeNull();
    expect(textContent(tree)).toContain('Tomorrow, 6:00 AM: Run 5 km');
  });
});
