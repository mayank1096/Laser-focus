import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors, motion, typography } from '../theme';
import { haptics } from '../utils/haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const PILL_WIDTH = 70;
const DONE_SIZE = 30;
/** Length of the tick stroke below, so it can be drawn in. */
const TICK_LENGTH = 16;

/**
 * "Allow" that, once granted, folds into a green circle and draws a tick.
 */
export function AllowButton({
  granted,
  onAllow,
  label = 'Allow',
  testID,
}: {
  granted: boolean;
  onAllow: () => void;
  label?: string;
  testID?: string;
}) {
  const done = useSharedValue(granted ? 1 : 0);
  const draw = useSharedValue(granted ? 1 : 0);

  useEffect(() => {
    if (granted) {
      done.value = withSpring(1, motion.spring);
      draw.value = withDelay(
        180,
        withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      done.value = withTiming(0, { duration: motion.fast });
      draw.value = 0;
    }
  }, [granted, done, draw]);

  const shell = useAnimatedStyle(() => ({
    width: PILL_WIDTH - (PILL_WIDTH - DONE_SIZE) * done.value,
    backgroundColor: interpolateColor(
      done.value,
      [0, 1],
      [colors.white, colors.successDeep],
    ),
    borderColor: interpolateColor(
      done.value,
      [0, 1],
      [colors.saffron, colors.successDeep],
    ),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, done.value * 2),
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: draw.value > 0 ? 1 : 0,
    transform: [{ scale: 0.7 + draw.value * 0.3 }],
  }));
  const tickProps = useAnimatedProps(() => ({
    strokeDashoffset: TICK_LENGTH * (1 - draw.value),
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={granted ? `${label}ed` : label}
      accessibilityState={{ checked: granted }}
      disabled={granted}
      hitSlop={6}
      onPress={() => {
        haptics.success();
        onAllow();
      }}
    >
      <Animated.View style={[styles.shell, shell]}>
        <Animated.Text
          style={[typography.label, styles.label, labelStyle]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
        <Animated.View style={[styles.tick, tickStyle]} pointerEvents="none">
          <Svg width={16} height={16} viewBox="0 0 18 18">
            <AnimatedPath
              d="M4 9.5 L7.5 13 L14 5.5"
              stroke={colors.white}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray={TICK_LENGTH}
              animatedProps={tickProps}
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: DONE_SIZE,
    borderRadius: DONE_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    color: colors.saffron,
  },
  tick: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
