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
  success: () => HapticFeedback.trigger('notificationSuccess', options),
  warning: () => HapticFeedback.trigger('notificationWarning', options),
};
