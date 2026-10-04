import type { PlanningRhythm } from '../types/models';
import { DAY_NAMES, formatClock } from '../utils/date';

/**
 * Local notifications for the planning rhythm.
 *
 * TODO(devs): wire to a notification library (we suggest
 * `@notifee/react-native`):
 * - weekly: "Plan your week" on `rhythm.weeklyDay` at `rhythm.weeklyAt`.
 * - nightly: at `rhythm.nightlyAt`, only if tomorrow is not sealed yet.
 *   Title "Tomorrow isn’t sealed yet", body "{n} sessions need a sheet.
 *   Three minutes, then sleep." (Figma 6.06). Cancel it once the day is
 *   sealed.
 * Ask for notification permission on the "Done" of the rhythm screen.
 */
export const reminders = {
  schedule(rhythm: PlanningRhythm) {
    if (__DEV__) {
      console.log(
        `[reminders] weekly ${DAY_NAMES[rhythm.weeklyDay]} ${formatClock(
          rhythm.weeklyAt,
        )}, nightly ${formatClock(rhythm.nightlyAt)}`,
      );
    }
  },
  /** Tomorrow is sealed: the nightly nudge is no longer needed. */
  cancelNightly() {},
};
