import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
import { useProfile } from '../src/features/account/store';
import { useGoalSetup } from '../src/features/onboarding/store';
import { usePlanning } from '../src/features/planning/store';
import { CHECKLIST } from '../src/features/session/ritual/content';
import { useSessions } from '../src/features/session/store';
import { hold, press, textContent, tick, type } from '../test/flowHelpers';

jest.useFakeTimers();
// Today's glow drifts on a loop, so each faked second renders frames.
jest.setTimeout(15000);
const DAY = '2026-10-04';

describe('a focused session', () => {
  beforeEach(() => {
    jest.setSystemTime(new Date(2026, 9, 4, 5, 50));
    useSessions.getState().reset();
    usePlanning.getState().reset();
    useGoalSetup.getState().reset();
    useProfile.getState().reset();
    useGoalSetup.setState({
      values: [
        { id: 'v1', text: 'I never wasted a day' },
        { id: 'v2', text: 'I reached my potential' },
      ],
      goals: [{ id: 'g1', text: 'Clear CA Foundation', isPrimary: true }],
      completed: true,
    });
    useProfile.setState({
      account: { method: 'apple', email: 'a@b.c', signedInAt: 'x' },
      pratigya: 'arjun',
      vowTakenAt: 'x',
    });
    usePlanning.setState({ setupDone: true, startedOn: DAY });
    const id = usePlanning
      .getState()
      .addTask(
        { text: 'Mock 23', kind: 'deep', priority: 3, sessionsNeeded: 2 },
        DAY,
      );
    usePlanning.getState().assignTask(DAY, 'slot_morning', id);
    usePlanning.getState().saveSheet(DAY, 'slot_morning', {
      outcome: 'Paper 1 attempted in full',
      challenge: 'Finish in 3 hours',
      steps: [{ id: 's', text: 'Phone in the other room' }],
      minutes: 30,
      failureModes: ['Phone on the desk'],
    });
  });

  it('runs the ritual, the session and the reckoning', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });
    expect(textContent(tree)).toContain('Start Session');
    await press(tree, 'today-begin-slot_morning');

    // Ritual
    expect(textContent(tree)).toContain('Pranam & enter.');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('You said these would sink you');
    await press(tree, 'next-button'); // locked until every box is ticked
    expect(textContent(tree)).toContain('Only the work in reach.');
    for (const item of CHECKLIST.flatMap(g => g.items)) {
      await press(tree, `check-${item}`);
    }
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('Slow. Like a warrior monk.');
    // Three breaths of 4 + 4 + 6 seconds, then it moves on by itself.
    for (let i = 0; i < 12; i++) {
      await tick(4000);
    }
    expect(textContent(tree)).toContain('Fold your hands.');
    await press(tree, 'pray-skip');
    expect(textContent(tree)).toContain('Arjuna didn’t lift the bow');
    for (let i = 0; i < 3; i++) {
      await tick(1500);
    }
    await hold(tree, 'values-hold');
    expect(textContent(tree)).toContain('Look at your work.');
    await press(tree, 'tratak-skip');
    // 5…1, then Jay Shree Ram.
    for (let i = 0; i < 8; i++) {
      await tick(1000);
    }

    // In session
    expect(useSessions.getState().active).toMatchObject({
      slotId: 'slot_morning',
      minutes: 30,
    });
    expect(textContent(tree)).toContain('left of 30 min');
    jest.setSystemTime(new Date(2026, 9, 4, 6, 40));
    await tick(1000);

    // Done
    expect(textContent(tree)).toContain('Lakshya bhed.');
    expect(usePlanning.getState().tasks[0].sessionsDone).toBe(1);
    await type(tree, 'result-note', '64/100 in 2 h 58');
    await press(tree, 'mark-it');
    expect(useSessions.getState().results[DAY].slot_morning).toMatchObject({
      finished: 'yes',
      note: '64/100 in 2 h 58',
      endedEarly: false,
    });
    expect(textContent(tree)).toContain('Full mark.');
  });

  it('ends early with a half mark after ten minutes', async () => {
    useSessions
      .getState()
      .start(
        { date: DAY, slotId: 'slot_morning', taskId: null, minutes: 90 },
        new Date(2026, 9, 4, 6, 0),
      );
    jest.setSystemTime(new Date(2026, 9, 4, 6, 14));
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });
    // Reopening the app goes straight back into the running session.
    expect(textContent(tree)).toContain('left of 90 min');
    await act(async () => {
      tree.root
        .findAll(
          n =>
            n.props.testID === 'in-session' &&
            typeof n.props.onLongPress === 'function',
        )
        .at(-1)!
        .props.onLongPress();
    });
    expect(textContent(tree)).toContain('End early?');
    expect(textContent(tree)).toContain('still counts as a half mark');
    await press(tree, 'reason-Called away');
    await hold(tree, 'end-hold');
    expect(useSessions.getState().results[DAY].slot_morning).toMatchObject({
      endedEarly: true,
      minutes: 14,
      earlyReason: 'Called away',
    });
    expect(textContent(tree)).toContain('Half mark.');
  });
});
