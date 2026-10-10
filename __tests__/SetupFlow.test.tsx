import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
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

describe('setup', () => {
  beforeEach(() => {
    jest.setSystemTime(new Date(2026, 9, 7, 20, 0));
    useBook.getState().reset();
    useProfile.getState().reset();
  });

  it('signs in, writes the book, takes the vow and plans the first session', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });

    // 01 Sign in
    expect(textContent(tree)).toContain(
      'A warrior never leaves his bow behind.',
    );
    await press(tree, 'auth-phone');
    await type(tree, 'phone-input', '9876543210');
    await press(tree, 'send-code');
    await tick(500);
    await type(tree, 'code-input', '123456');
    await tick(500); // six digits verify by themselves
    expect(useProfile.getState().account?.phone).toBe('919876543210');

    // 02 Welcome, with a name
    await type(tree, 'name-input', 'Rohan');
    await press(tree, 'begin');
    expect(useProfile.getState().name).toBe('Rohan');

    // 03 Values: the course's lines are already there
    expect(useBook.getState().values.length).toBeGreaterThanOrEqual(3);
    await press(tree, 'next-button');

    // 04 Goals: one goal is circled for you, so 05 is skipped
    await addLine(tree, 'goals-list', 'Earn ₹1 lakh a month');
    await press(tree, 'next-button');
    const goal = useBook.getState().goals[0];
    expect(useBook.getState().circledGoalId).toBe(goal.id);

    // 06 Milestones
    for (const m of ['10 clients', '₹50k month', '₹1 lakh month']) {
      await addLine(tree, 'milestones-list', m);
    }
    await press(tree, 'next-button');

    // 07 This week's tasks
    await addLine(tree, 'tasks-list', 'Cut 3 client reels');
    await press(tree, 'next-button');
    const task = useBook.getState().tasks[0];
    expect(task.milestoneId).toBe(useBook.getState().milestones[0].id);

    // 08 Rhythm
    await press(tree, 'next-button');
    expect(useBook.getState().setup).toBe('vow');

    // The vow
    await press(tree, 'pratigya-arjun');
    await press(tree, 'next-button');
    await press(tree, 'next-button');
    for (const p of ['screenTime', 'focus', 'notifications']) {
      await press(tree, `allow-${p}`);
      await tick(1000);
    }
    await press(tree, 'next-button');
    await press(tree, 'work-YouTube');
    await press(tree, 'delete-BGMI');
    await tick(1000);
    await press(tree, 'next-button');
    await hold(tree, 'vow-hold');
    await tick(1000);
    expect(useBook.getState().setup).toBe('plan');

    // Hey, Rohan: tap through the lines
    expect(textContent(tree)).toContain('Hey, Rohan');
    for (let i = 0; i < 5; i++) {
      await press(tree, 'next-button');
      await tick(300);
    }

    // 09 First session
    await press(tree, `pick-0-${task.id}`);
    await type(tree, 'outcome-0', 'Reel 1 exported');
    await press(tree, 'time-0-120');
    await press(tree, 'plan-save');
    await tick(1000);
    const [session] = useBook.getState().sessions;
    expect(session).toMatchObject({
      what: 'Cut 3 client reels',
      outcome: 'Reel 1 exported',
      minutes: 120,
      date: '2026-10-08',
    });

    // 10 Setup done → 11 Home
    await press(tree, 'go-home');
    await tick(1000);
    expect(useBook.getState().setup).toBe('done');
    expect(textContent(tree)).toContain(
      'Tomorrow, 6:00 AM: Cut 3 client reels',
    );
  });
});
