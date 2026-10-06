import { textContent } from '../test/flowHelpers';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
import { useProfile } from '../src/features/account/store';
import { useGoalSetup } from '../src/features/onboarding/store';
import { planFor, usePlanning } from '../src/features/planning/store';

jest.useFakeTimers();
// Sunday evening, planning Monday.
jest.setSystemTime(new Date(2026, 9, 4, 21, 30));
const TOMORROW = '2026-10-05';

const host = (tree: ReactTestRenderer, id: string) =>
  tree.root
    .findAll(n => n.props.testID === id && typeof n.type === 'string')
    .at(-1)!;

async function press(tree: ReactTestRenderer, id: string) {
  await act(async () => {
    tree.root
      // Screens below in the stack stay mounted; the last match is the top.
      .findAll(
        n =>
          n.props.testID === id &&
          typeof n.props.onPress === 'function' &&
          n.props.accessibilityRole !== undefined,
      )
      .at(-1)!
      .props.onPress();
    jest.runOnlyPendingTimers();
  });
}

async function type(tree: ReactTestRenderer, id: string, text: string) {
  await act(async () => {
    host(tree, id).props.onChangeText(text);
  });
}

async function addLine(tree: ReactTestRenderer, list: string, text: string) {
  await type(tree, `${list}-input`, text);
  await act(async () => {
    host(tree, `${list}-input`).props.onBlur();
    jest.runOnlyPendingTimers();
  });
}

describe('planning flow', () => {
  beforeEach(() => {
    usePlanning.getState().reset();
    useGoalSetup.getState().reset();
    useGoalSetup.setState({
      goals: [{ id: 'g1', text: 'Clear CA Foundation', isPrimary: true }],
      completed: true,
    });
    // Signed in and vowed: the next thing is shaping the week.
    useProfile.getState().reset();
    useProfile.setState({
      name: 'Aarav',
      account: { method: 'phone', phone: '919876543210', signedInAt: 'x' },
      pratigya: 'arjun',
      vowTakenAt: '2026-10-04T10:00:00.000Z',
    });
  });

  it('sets up the week, plans tomorrow, writes a sheet and seals it', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });

    // Goals, account and vow done: the next step is shaping the week.
    expect(textContent(tree)).toContain('When do you go deep?');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('When do the small things get done?');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('When will you plan?');
    await press(tree, 'rhythm-day-0');
    await press(tree, 'next-button');

    expect(usePlanning.getState()).toMatchObject({
      setupDone: true,
      startedOn: '2026-10-04',
      rhythm: { weeklyDay: 0 },
    });
    // The Day 1 greeting, tapped through, then home.
    expect(textContent(tree)).toContain('Hey, Aarav');
    for (
      let i = 0;
      i < 6 && textContent(tree).includes('Tap to continue');
      i++
    ) {
      await press(tree, 'next-button');
    }
    expect(textContent(tree)).toContain('An open day.');
    await press(tree, 'tab-tasks');
    expect(textContent(tree)).toContain('This week');
    expect(textContent(tree)).toContain('Tomorrow isn’t sealed yet');

    // Add a deep task.
    await press(tree, 'task-add');
    await press(tree, 'task-save'); // locked until it has a name
    expect(usePlanning.getState().tasks).toHaveLength(0);
    await type(tree, 'task-text', 'Mock 24 — Paper 2, Law');
    await press(tree, 'priority-3');
    await press(tree, 'task-sessions-plus');
    await press(tree, 'task-save');
    const [task] = usePlanning.getState().tasks;
    expect(task).toMatchObject({
      text: 'Mock 24 — Paper 2, Law',
      kind: 'deep',
      priority: 3,
      sessionsNeeded: 2,
    });

    // Plan tomorrow: give the morning session the task.
    await press(tree, 'tomorrow-nudge');
    expect(textContent(tree)).toContain('Plan tomorrow');
    await press(tree, 'plan-slot-slot_morning');
    await press(tree, `pick-${task.id}`);
    expect(textContent(tree)).toContain('Write the 6:00 AM sheet');
    await press(tree, 'plan-cta');

    // The sheet, four screens.
    expect(textContent(tree)).toContain('What will be finished?');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('What will be finished?');
    await type(tree, 'sheet-outcome', 'Paper 2 attempted in full');
    await press(tree, 'next-button');

    expect(textContent(tree)).toContain('Make it one step harder.');
    await press(tree, 'challenge-faster');
    await type(tree, 'sheet-challenge', 'Finish in 3 hours');
    await press(tree, 'next-button');

    expect(textContent(tree)).toContain('How will you do it?');
    await press(tree, 'next-button'); // needs a step
    expect(textContent(tree)).toContain('How will you do it?');
    await addLine(tree, 'sheet-steps', 'Phone in the other room');
    await press(tree, 'next-button');

    expect(textContent(tree)).toContain('What guarantees failure?');
    await press(tree, 'failure-Starting late');
    await press(tree, 'next-button');

    // Every planned session has a sheet: seal it.
    expect(textContent(tree)).toContain('Nothing left to decide.');
    expect(planFor(usePlanning.getState(), TOMORROW).sessions[0].sheet).toEqual(
      expect.objectContaining({
        outcome: 'Paper 2 attempted in full',
        challenge: 'Finish in 3 hours',
        challengeKind: 'faster',
        minutes: 90,
        failureModes: ['Starting late'],
      }),
    );
    await act(async () => {
      // Screen readers activate the hold in one go.
      tree.root
        .find(
          n =>
            n.props.testID === 'seal-hold' &&
            typeof n.props.onAccessibilityAction === 'function',
        )
        .props.onAccessibilityAction();
      jest.runOnlyPendingTimers();
    });
    expect(textContent(tree)).toContain('Tomorrow is sealed.');
    expect(planFor(usePlanning.getState(), TOMORROW).sealedAt).not.toBeNull();

    await press(tree, 'seal-rest');
    expect(textContent(tree)).toContain('Tomorrow is sealed');
    expect(textContent(tree)).toContain('This week');
  });

  it('blocks a session without a sheet until a quick one is written', async () => {
    usePlanning.setState({ setupDone: true, startedOn: '2026-10-04' });
    const id = usePlanning
      .getState()
      .addTask(
        { text: 'Mock 25', kind: 'deep', priority: 2, sessionsNeeded: 1 },
        '2026-10-04',
      );
    // Planned, but no sheet was written last night.
    usePlanning.getState().assignTask('2026-10-04', 'slot_morning', id);
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });

    expect(textContent(tree)).toContain('Start Session');
    expect(textContent(tree)).toContain('No sheet yet');
    await press(tree, 'today-begin-slot_morning');
    expect(textContent(tree)).toContain('No sheet, no session.');

    await press(tree, 'gate-begin');
    expect(textContent(tree)).toContain('No sheet, no session.');
    expect(textContent(tree)).toContain('Write what will be finished');

    await type(tree, 'gate-outcome', 'Paper 3 attempted');
    await type(tree, 'gate-challenge', 'No calculator for Part A');
    expect(textContent(tree)).toContain('Pick one way you could fail');
    await press(tree, 'gate-failure-Hunger');
    await press(tree, 'gate-begin');

    // The sheet exists now; the ritual begins.
    expect(textContent(tree)).toContain('Pranam & enter.');
    expect(textContent(tree)).toContain('Paper 3 attempted');
    const today = planFor(usePlanning.getState(), '2026-10-04').sessions[0];
    expect(today.task?.id).toBe(id);
    expect(today.sheet?.failureModes).toEqual(['Hunger']);
  });

  it('asks for the Sacrifice sheet after the first week, with its twist', async () => {
    usePlanning.setState({ setupDone: true, startedOn: '2026-09-25' });
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });
    await press(tree, 'tab-tasks');
    await press(tree, 'sacrifice-nudge');
    expect(textContent(tree)).toContain('What will you give up?');

    await addLine(tree, 'giveup-list', 'Instagram before 8 PM');
    await addLine(tree, 'keep-list', 'Sunday lunch with family');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('Someone wants it more.');
    expect(usePlanning.getState().sacrifice).toBeNull();

    // Redo goes back to the sheet; saving it skips the twist the second time.
    await press(tree, 'sacrifice-redo');
    expect(textContent(tree)).toContain('What will you give up?');
    await addLine(tree, 'giveup-list', 'Weekend cricket');
    await press(tree, 'next-button');

    expect(usePlanning.getState().sacrifice?.giveUp.map(l => l.text)).toEqual([
      'Instagram before 8 PM',
      'Weekend cricket',
    ]);
    expect(textContent(tree)).not.toContain('Week 1 done. One more sheet.');
  });
});
