import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import App from '../App';
import { useProfile } from '../src/features/account/store';
import { useGoalSetup } from '../src/features/onboarding/store';
import { usePlanning } from '../src/features/planning/store';
import { hold, press, textContent, tick, type } from '../test/flowHelpers';

jest.useFakeTimers();
jest.setSystemTime(new Date(2026, 9, 4, 21, 30));

describe('account and vow', () => {
  beforeEach(() => {
    useProfile.getState().reset();
    usePlanning.getState().reset();
    useGoalSetup.getState().reset();
    useGoalSetup.setState({
      values: [{ id: 'v1', text: 'I never wasted a day' }],
      goals: [
        { id: 'g1', text: 'Clear CA Foundation by June 2027', isPrimary: true },
      ],
      antiGoals: [{ id: 'a1', text: 'Papa ki mehnat waste ho gayi' }],
      completed: true,
    });
    useProfile.setState({ name: 'Aarav' });
  });

  it('signs in by phone, takes the Arjun vow and moves on to the week', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });

    expect(textContent(tree)).toContain('A warrior never leaves his bow behind.');
    await press(tree, 'auth-phone');
    expect(textContent(tree)).toContain('Your phone number');
    await type(tree, 'phone-input', '98765 4321');
    await press(tree, 'send-code'); // nine digits: locked
    expect(textContent(tree)).toContain('Your phone number');
    await type(tree, 'phone-input', '9876543210');
    await press(tree, 'send-code');
    await tick(500);

    expect(textContent(tree)).toContain('Enter the code');
    await type(tree, 'code-input', '482913');
    await tick(500);
    expect(useProfile.getState().account).toMatchObject({
      method: 'phone',
      phone: '919876543210',
    });

    // Path & Pratigya
    expect(textContent(tree)).toContain('Will you be tested every day');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('Will you be tested every day');
    await press(tree, 'path-challenge');
    await press(tree, 'next-button');
    await press(tree, 'pratigya-arjun');
    await press(tree, 'next-button');
    expect(textContent(tree)).toContain('Delete every social media app');
    await press(tree, 'next-button');

    expect(textContent(tree)).toContain('3 left');
    await press(tree, 'allow-screenTime');
    await press(tree, 'allow-focus');
    await press(tree, 'allow-notifications');
    await press(tree, 'next-button');

    expect(textContent(tree)).toContain(
      'Two distractions are still on your phone.',
    );
    await press(tree, 'delete-BGMI');
    await press(tree, 'delete-YouTube');
    expect(textContent(tree)).toContain('The field is clear.');
    await press(tree, 'next-button');

    expect(textContent(tree)).toContain('मैं प्रतिज्ञा लेता हूँ।');
    expect(textContent(tree)).toContain(
      'Until I clear CA Foundation by June 2027, no distraction returns to my phone.',
    );
    await hold(tree, 'vow-hold');
    expect(useProfile.getState().vowTakenAt).not.toBeNull();
    expect(textContent(tree)).toContain('When do you go deep?');
  });

  it('keeps the app closed while the vow is broken', async () => {
    useProfile.setState({
      account: { method: 'google', email: 'a@b.c', signedInAt: 'x' },
      pratigya: 'arjun',
      vowTakenAt: 'x',
      brokenAt: new Date(2026, 9, 4, 9).toISOString(),
    });
    usePlanning.setState({ setupDone: true });
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<App />);
    });
    expect(textContent(tree)).toContain('You put down the bow.');
    await press(tree, 'next-button');
    expect(useProfile.getState().brokenAt).toBeNull();
    expect(textContent(tree)).toContain('An open day.');
  });
});
