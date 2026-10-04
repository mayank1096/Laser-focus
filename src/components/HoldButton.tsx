import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, motion, radii, typography } from '../theme';
import { haptics } from '../utils/haptics';

export interface HoldButtonProps {
  label: string;
  /** Called once the hold completes. */
  onComplete: () => void;
  /** How long a full hold takes, in ms. */
  duration?: number;
  testID?: string;
}

/** Haptic ticks while holding, so the hold feels like it is building. */
const TICKS = 4;

/**
 * A button you press and hold. Saffron fills it from the left; letting go
 * early drains it back. For moments that deserve a beat of intent — sealing
 * a day, switching a goal — rather than a quick tap.
 *
 * Screen readers can't hold, so the accessibility "activate" action
 * completes it straight away.
 */
export function HoldButton({
  label,
  onComplete,
  duration = 1600,
  testID,
}: HoldButtonProps) {
  const progress = useSharedValue(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) {
      return;
    }
    done.current = true;
    haptics.success();
    onComplete();
  };

  const tick = () => haptics.selection();

  useAnimatedReaction(
    () => Math.floor(progress.value * TICKS),
    (current, previous) => {
      if (previous !== null && current > previous && current < TICKS) {
        scheduleOnRN(tick);
      }
    },
  );

  const start = () => {
    if (done.current) {
      return;
    }
    haptics.tap();
    cancelAnimation(progress);
    progress.value = withTiming(
      1,
      {
        duration: (1 - progress.value) * duration,
        easing: Easing.linear,
      },
      finished => {
        if (finished) {
          scheduleOnRN(finish);
        }
      },
    );
  };

  const release = () => {
    if (done.current || progress.value >= 1) {
      return;
    }
    cancelAnimation(progress);
    progress.value = withTiming(0, {
      duration: motion.base,
      easing: motion.easeOut,
    });
  };

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - Math.min(progress.value, 0.1) * 0.3 }],
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={finish}
      onPressIn={start}
      onPressOut={release}
    >
      <Animated.View style={[styles.button, pressStyle]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
        <Animated.Text style={typography.button}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: radii.button,
    backgroundColor: colors.charcoal,
    overflow: 'hidden',
    boxShadow: '0px 13px 17px rgba(0, 0, 0, 0.3)',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.saffron,
    transformOrigin: 'left',
  },
});
