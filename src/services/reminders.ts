import type { Rhythm } from '../core/model';

/**
 * The app's only notification: the evening reminder to plan tomorrow.
 *
 * TODO(devs): wire to a notification library (we suggest
 * `@notifee/react-native`). Schedule a daily trigger at `rhythm.reminderAt`
 * when `rhythm.reminderOn`; skip the day when tomorrow already has a plan.
 * Title "Plan tomorrow", no body. Ask for permission on the vow's
 * Permissions screen. Nothing else is ever sent.
 */
export const reminders = {
  schedule(_rhythm: Rhythm) {},
};
