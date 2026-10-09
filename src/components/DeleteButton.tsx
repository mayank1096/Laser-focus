import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import Trash from '../assets/icons/trash.svg';
import { colors, motion, springs, typography } from '../theme';
import { haptics } from '../utils/haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const TICK_LENGTH = 16;
const SIZE = 30;
/** How long the tick holds before the row settles on "Deleted". */
const TICK_HOLD = 650;

type Phase = 'idle' | 'tick' | 'done';

/**
 * Delete → a tick draws in a red circle → the button settles as a quiet
 * red "Deleted". Something removed for good gets a beat of confirmation.
 */
export function DeleteButton({
  deleted,
  onDelete,
  labels = ['Delete', 'Deleted'],
  testID,
}: {
  deleted: boolean;
  onDelete: () => void;
  /** [idle, done] labels, translated by the caller. */
  labels?: [string, string];
  testID?: string;
}) {
  const [phase, setPhase] = useState<Phase>(deleted ? 'done' : 'idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const width = useSharedValue(deleted ? 84 : 92);
  const draw = useSharedValue(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (deleted && phase === 'idle') {
      setPhase('tick');
      width.value = withSpring(SIZE, springs.morph);
      draw.value = withTiming(1, {
        duration: motion.base,
        easing: Easing.out(Easing.cubic),
      });
      timer.current = setTimeout(() => {
        setPhase('done');
        width.value = withSpring(84, springs.morph);
      }, TICK_HOLD);
    }
  }, [deleted, phase, width, draw]);

  const shell = useAnimatedStyle(() => ({ width: width.value }));
  const tickProps = useAnimatedProps(() => ({
    strokeDashoffset: TICK_LENGTH * (1 - draw.value),
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={deleted ? labels[1] : labels[0]}
      accessibilityState={{ disabled: deleted }}
      disabled={deleted}
      hitSlop={6}
      onPress={() => {
        haptics.heavy();
        onDelete();
      }}
    >
      <Animated.View
        style={[
          styles.shell,
          phase === 'idle' && styles.idle,
          phase === 'tick' && styles.tick,
          phase === 'done' && styles.done,
          shell,
        ]}
      >
        {phase === 'idle' ? (
          <View style={styles.row}>
            <Trash width={15} height={15} color={colors.danger} />
            <Animated.Text style={[typography.label, styles.red]}>
              {labels[0]}
            </Animated.Text>
          </View>
        ) : null}
        {phase === 'tick' ? (
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
        ) : null}
        {phase === 'done' ? (
          <Animated.Text
            entering={FadeIn.duration(motion.fast)}
            style={[typography.label, styles.red]}
            numberOfLines={1}
          >
            {labels[1]}
          </Animated.Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  idle: {
    borderColor: 'rgba(222, 7, 7, 0.35)',
    backgroundColor: colors.white,
  },
  tick: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  done: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(222, 7, 7, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  red: {
    color: colors.danger,
  },
});
