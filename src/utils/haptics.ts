import { Vibration } from 'react-native';
import HapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

/**
 * The only place the app talks to the haptics library, so the feel of the
 * whole app can be tuned here.
 */
export const haptics = {
  /** A ruler tick or a choice changing. */
  selection: () => HapticFeedback.trigger('selection', options),
  /** A button press. */
  tap: () => HapticFeedback.trigger('impactLight', options),
  /** Something firm landed — a step completed. */
  confirm: () => HapticFeedback.trigger('impactMedium', options),
  /** A heavy beat: each number of the countdown, a session starting. */
  heavy: () => HapticFeedback.trigger('impactHeavy', options),
  success: () => HapticFeedback.trigger('notificationSuccess', options),
  warning: () => HapticFeedback.trigger('notificationWarning', options),

  /**
   * Longer patterns for when the phone is face down or in another room;
   * light taps would go unnoticed there.
   */
  pattern: {
    /** Halfway through a session: two soft pulses. */
    halfway: () => Vibration.vibrate([0, 90, 160, 90]),
    /** The session is over: one long pulse, then two short. */
    end: () => Vibration.vibrate([0, 600, 200, 120, 120, 120]),
    /** One breath phase: a gentle swell. */
    breath: () => Vibration.vibrate([0, 40, 60, 40, 60, 40]),
  },
};
