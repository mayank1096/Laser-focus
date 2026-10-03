import { paceFor } from '../src/utils/pace';
import { countableNoun } from '../src/utils/text';
import {
  distributeDueMonths,
  formatDuration,
  shortMonthLabel,
} from '../src/utils/time';

describe('formatDuration', () => {
  it.each([
    [1, '1 month'],
    [5, '5 months'],
    [12, '1 year'],
    [16, '1 year 4 months'],
    [25, '2 years 1 month'],
  ])('%i months → %s', (months, expected) => {
    expect(formatDuration(months)).toBe(expected);
  });
});

describe('countableNoun', () => {
  it.each([
    ['Attempt a full-length mock test', 'full-length mock tests'],
    ['Publish 1 video', 'videos'],
    ['Write one blog entry', 'blog entries'],
    ['Solve the practice batch', 'practice batches'],
    ['Run', 'times'],
    ['', 'times'],
  ])('%s → %s', (action, expected) => {
    expect(countableNoun(action)).toBe(expected);
  });
});

describe('distributeDueMonths', () => {
  it('spreads milestones evenly and ends on the deadline', () => {
    const from = new Date(2026, 9, 3); // Oct 2026
    expect(distributeDueMonths(3, 12, from)).toEqual([
      '2027-02',
      '2027-06',
      '2027-10',
    ]);
  });

  it('never schedules a milestone for the current month', () => {
    const from = new Date(2026, 9, 3);
    expect(distributeDueMonths(4, 1, from)).toEqual([
      '2026-11',
      '2026-11',
      '2026-11',
      '2026-11',
    ]);
  });

  it('labels months', () => {
    expect(shortMonthLabel('2027-02')).toBe('Feb');
  });
});

describe('paceFor', () => {
  it('describes a comfortable pace', () => {
    expect(paceFor(24, 16, 'mock tests')).toEqual({
      label: 'About 1.5 mock tests a month',
      warning: null,
    });
  });

  it('warns when the pace is not believable', () => {
    expect(paceFor(500, 1, 'mock tests').warning).toMatch(/two a day/);
    expect(paceFor(3, 12, 'books').warning).toMatch(/Raise the bar/);
  });
});
