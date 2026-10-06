import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { sansDigits } from '../../components/Numerals';
import { ThinkingOrb } from '../../components/orb';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { today } from '../../utils/clock';
import { addDays, formatClock } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { firstName, useProfile } from '../account/store';
import { planFor, usePlanning } from '../planning/store';
import { useGoalProgress } from '../progress';

/** The pace of one line: arrive, stay, leave. Slow on purpose. */
const IN = 1100;
const HOLD = 2600;
const OUT = 800;
/** A breath before the first line, while the colour settles. */
const FIRST_DELAY = 900;
/** The light at the bottom rises and sinks over this long. */
const TIDE = 5200;

const DEEP = '#DD5800';
const LIGHT = '#F9E0CB';

/**
 * The first moment after the vow. A deep saffron field whose light rises
 * and sinks from the bottom like a slow tide, a thought-orb turning above,
 * and a few lines that arrive and leave one at a time — a greeting, the
 * vow, the count, the first session — before the app opens.
 */
export function DayOneScreen({ navigation }: RootScreenProps<'DayOne'>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const name = firstName(useProfile(s => s.name));
  const progress = useGoalProgress();
  const planning = usePlanning();
  const first = planFor(planning, addDays(today(), 1)).sessions[0];
  const [index, setIndex] = useState(0);
  const finished = useRef(false);

  const lines = useMemo(
    () => [
      name ? `Hey, ${name}` : 'Hey, warrior',
      'The vow is taken.',
      `This is day 1 of ${progress.days}.`,
      'The bow is in your hands now.',
      first
        ? `Your first arrow leaves tomorrow, ${formatClock(first.slot.start)}.`
        : 'Your first arrow leaves tomorrow.',
    ],
    [name, progress.days, first],
  );

  const enter = () => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const next = () => {
    if (index < lines.length - 1) {
      setIndex(i => i + 1);
    } else {
      enter();
    }
  };

  // One line at a time: rise softly into place, stay, drift up and away.
  const shown = useSharedValue(0);
  const lift = useSharedValue(0);
  useEffect(() => {
    shown.value = 0;
    lift.value = 0;
    const delay = index === 0 ? FIRST_DELAY : 120;
    shown.value = withDelay(
      delay,
      withTiming(1, { duration: IN, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    );
    if (index > 0) {
      haptics.selection();
    }
    const leave = setTimeout(() => {
      lift.value = withTiming(1, {
        duration: OUT,
        easing: Easing.bezier(0.55, 0, 0.75, 0.3),
      });
      shown.value = withTiming(
        0,
        { duration: OUT, easing: Easing.in(Easing.quad) },
        done => {
          if (done) {
            scheduleOnRN(next);
          }
        },
      );
    }, delay + IN + HOLD);
    return () => clearTimeout(leave);
    // `next` closes over `index`, which is already a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lines.length]);

  const lineStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [
      // Arrives from 18 below; leaves 26 above.
      {
        translateY: (1 - shown.value) * 18 * (1 - lift.value) - lift.value * 26,
      },
      { scale: 0.985 + shown.value * 0.015 },
    ],
  }));

  // The tide: the light at the bottom slowly rises and sinks.
  const tide = useSharedValue(0);
  const arrive = useSharedValue(0);
  useEffect(() => {
    arrive.value = withTiming(1, { duration: 700 });
    tide.value = withRepeat(
      withTiming(1, { duration: TIDE, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [tide, arrive]);
  const glowHeight = height * 0.92;
  const tideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - tide.value) * height * 0.16 }],
  }));
  const orbStyle = useAnimatedStyle(() => ({
    opacity: arrive.value,
    transform: [{ scale: 0.92 + arrive.value * 0.08 }],
  }));

  return (
    <Pressable
      testID="next-button"
      accessibilityRole="button"
      accessibilityLabel={lines[index]}
      onPress={next}
      style={styles.screen}
    >
      {/* Deep saffron above, warming toward the light below. */}
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          <LinearGradient id="greet-base" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={DEEP} />
            <Stop offset="0.5" stopColor="#E06A12" />
            <Stop offset="1" stopColor="#EB9050" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#greet-base)" />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { height: glowHeight }, tideStyle]}
      >
        <Svg width={width} height={glowHeight}>
          <Defs>
            <LinearGradient id="greet-tide" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={LIGHT} stopOpacity="0" />
              <Stop offset="0.45" stopColor="#F2B183" stopOpacity="0.5" />
              <Stop offset="0.8" stopColor={LIGHT} stopOpacity="0.95" />
              <Stop offset="1" stopColor={LIGHT} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={glowHeight} fill="url(#greet-tide)" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.orb, { top: insets.top + 64 }, orbStyle]}
      >
        <ThinkingOrb
          state="composing"
          size={64}
          displaySize={120}
          speed={0.8}
          theme="light"
          tint={colors.white}
          accessibilityLabel="Laser Focus"
        />
      </Animated.View>

      <View style={styles.stage} pointerEvents="none">
        <Animated.Text
          style={[styles.line, lineStyle]}
          accessibilityLiveRegion="polite"
        >
          {sansDigits(lines[index])}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DEEP,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -60,
  },
  orb: {
    position: 'absolute',
    alignSelf: 'center',
  },
  stage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.gutter + spacing.xl,
  },
  line: {
    ...typography.title,
    lineHeight: 34,
    color: colors.white,
    textAlign: 'center',
  },
});
