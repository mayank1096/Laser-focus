/** Average weeks in a month. */
const WEEKS_PER_MONTH = 4.345;

export interface Pace {
  /** e.g. "About 2 mock tests a week". */
  label: string;
  /** Too much or too little to be believable. */
  warning: string | null;
}

const round = (n: number) =>
  n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;

/**
 * What a count over a deadline asks of the user, so they can judge it.
 * The course: practical, and hard enough that failing is impossible.
 */
export function paceFor(count: number, months: number, noun: string): Pace {
  const perWeek = count / (months * WEEKS_PER_MONTH);
  const perDay = perWeek / 7;
  let label: string;
  if (perDay >= 1) {
    label = `About ${round(perDay)} ${noun} a day`;
  } else if (perWeek >= 1) {
    label = `About ${round(perWeek)} ${noun} a week`;
  } else {
    label = `About ${round(count / months)} ${noun} a month`;
  }
  let warning: string | null = null;
  if (perDay > 2) {
    warning = 'More than two a day. Be honest: can you keep this up?';
  } else if (count / months < 1) {
    warning = 'Less than one a month. Raise the bar or bring the date closer.';
  }
  return { label, warning };
}
