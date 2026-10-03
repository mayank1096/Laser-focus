import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
import { useGoalSetup } from '../src/features/onboarding/store';

jest.useFakeTimers();

const findByTestId = (tree: ReactTestRenderer, id: string) =>
  tree.root.find(
    node => node.props.testID === id && typeof node.type === 'string',
  );

const textContent = (tree: ReactTestRenderer) => JSON.stringify(tree.toJSON());

async function press(tree: ReactTestRenderer, id: string) {
  await act(async () => {
    tree.root
      // The pressable itself (it carries the accessibility role), not the
      // wrapping component — so disabled states are respected.
      .find(
        n =>
          n.props.testID === id &&
          typeof n.props.onPress === 'function' &&
          n.props.accessibilityRole !== undefined,
      )
      .props.onPress();
    jest.runOnlyPendingTimers();
  });
}

async function addLine(tree: ReactTestRenderer, list: string, text: string) {
  await press(tree, `${list}-add`);
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
  beforeEach(() => useGoalSetup.getState().reset());

  it('walks from the welcome screen through every question', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });

    expect(textContent(tree)).toContain('Laser Focus');
    await press(tree, 'welcome-start');

    // 1. Values — Next stays locked until a line exists.
    expect(textContent(tree)).toContain(
      'What do you want said about you when you die?',
    );
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain(
      'What do you want said about you when you die?',
    );
    await addLine(tree, 'values-list', 'I never wasted a single day');
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

    // 7. Deadline
    expect(textContent(tree)).toContain('1 year 4 months');
    await press(tree, 'next-button');

    // 8. Milestones are pre-filled from the count
    expect(useGoalSetup.getState().milestones).toHaveLength(3);
    await press(tree, 'next-button');

    // 9. Anti-goal
    expect(textContent(tree)).toContain('Write the regrets');
    await addLine(tree, 'antigoals-list', 'Papa ki mehnat waste jaygi');
    await press(tree, 'next-button');

    expect(textContent(tree)).toContain('Your sheets are written');
    expect(useGoalSetup.getState().toPlan()).toMatchObject({
      action: 'Attempt a full-length mock test',
      workShape: 'repeated',
      targetCount: 24,
      deadlineMonths: 16,
    });
  });
});
