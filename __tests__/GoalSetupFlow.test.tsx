import { textContent } from '../test/flowHelpers';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
import { useProfile } from '../src/features/account/store';
import { useGoalSetup } from '../src/features/onboarding/store';

jest.useFakeTimers();

const findByTestId = (tree: ReactTestRenderer, id: string) =>
  tree.root
    .findAll(node => node.props.testID === id && typeof node.type === 'string')
    .at(-1)!;

async function press(tree: ReactTestRenderer, id: string) {
  await act(async () => {
    tree.root
      // The pressable itself (it carries the accessibility role), not the
      // wrapping component — so disabled states are respected. Screens
      // below in the stack stay mounted; the last match is the top one.
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

async function addLine(tree: ReactTestRenderer, list: string, text: string) {
  const input = findByTestId(tree, `${list}-input`);
  await act(async () => {
    input.props.onChangeText(text);
  });
  await act(async () => {
    input.props.onBlur();
    jest.runOnlyPendingTimers();
  });
}

describe('goal setup flow', () => {
  beforeEach(() => {
    useGoalSetup.getState().reset();
    useProfile.getState().reset();
  });

  it('walks from the welcome screen through every question', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });

    expect(textContent(tree)).toContain('Laser Focus');
    await press(tree, 'welcome-start');

    // Language, then name.
    expect(textContent(tree)).toContain('Which language do you think in?');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('What should we call you?');
    await act(async () => {
      findByTestId(tree, 'name-input').props.onChangeText('Aarav');
    });
    expect(textContent(tree)).not.toContain('How it will look on your vow');
    await press(tree, 'next-button');

    // 1. Values — Next stays locked until a line exists.
    expect(textContent(tree)).toContain(
      'What do you want said about you when you die?',
    );
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain(
      'What do you want said about you when you die?',
    );
    await addLine(tree, 'values-list', 'I never wasted a single day');
    await addLine(tree, 'values-list', 'I reached my full potential');
    // Two of three lines: still locked, and the list says how many remain.
    expect(textContent(tree)).toContain('1 more to go');
    await press(tree, 'next-button');
    expect(useGoalSetup.getState().stepId).toBe('values');
    await addLine(tree, 'values-list', 'I leave with no regrets');
    await press(tree, 'next-button');

    // 2. Goals
    expect(textContent(tree)).toContain('Write your long-term goals');
    await addLine(tree, 'goals-list', 'Clear CA Foundation');
    await addLine(tree, 'goals-list', 'Earn ₹50,000 / month');
    await press(tree, 'next-button');

    // 3. Magic circle
    const [first] = useGoalSetup.getState().goals;
    await press(tree, `goal-option-${first.id}`);
    expect(useGoalSetup.getState().goals[0].isPrimary).toBe(true);
    await press(tree, 'next-button');

    // 4. Action
    await act(async () => {
      findByTestId(tree, 'action-input').props.onChangeText(
        'Attempt a full-length mock test',
      );
    });
    await press(tree, 'next-button');

    // 5. Work shape → repeated adds the count question
    await press(tree, 'shape-repeated');
    await press(tree, 'next-button');

    // 6. Count
    expect(textContent(tree)).toContain('How many full-length mock tests?');
    await press(tree, 'next-button');

    // 7. Deadline, with the pace it implies
    expect(textContent(tree)).toContain('1 year 4 months');
    expect(textContent(tree)).toContain('full-length mock tests a month');
    await press(tree, 'next-button');

    // 8. Milestones are pre-filled from the count
    expect(useGoalSetup.getState().milestones).toHaveLength(3);
    await press(tree, 'next-button');

    // 9. Anti-goal
    expect(textContent(tree)).toContain('Write the regrets');
    await addLine(tree, 'antigoals-list', 'Papa ki mehnat waste jaygi');
    await addLine(tree, 'antigoals-list', 'Batch ke saare log aage nikal gaye');
    await addLine(
      tree,
      'antigoals-list',
      'Five minutes of scrolling became five years',
    );
    await press(tree, 'next-button');

    // Written: now they're worth keeping safe.
    expect(textContent(tree)).toContain('A warrior never leaves his bow behind.');
    expect(useGoalSetup.getState().completed).toBe(true);
    expect(useGoalSetup.getState().toPlan()).toMatchObject({
      action: 'Attempt a full-length mock test',
      workShape: 'repeated',
      targetCount: 24,
      deadlineMonths: 16,
    });
  });

  it('skips the Magic Circle for a single goal and steps back', async () => {
    useGoalSetup.setState({
      values: [
        { id: 'v1', text: 'a' },
        { id: 'v2', text: 'b' },
        { id: 'v3', text: 'c' },
      ],
      stepId: 'goals',
    });
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });
    // Resumes on the saved question.
    expect(textContent(tree)).toContain('Write your long-term goals');
    await addLine(tree, 'goals-list', 'Clear CA Foundation');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('You cannot control the result');

    await press(tree, 'back-button');
    expect(textContent(tree)).toContain('Write your long-term goals');
    await press(tree, 'back-button');
    expect(textContent(tree)).toContain('What do you want said about you');
  });
});
