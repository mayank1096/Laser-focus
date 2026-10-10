import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sansDigits } from '../../components/Numerals';
import { ThinkingOrb } from '../../components/orb';
import { ShaderView } from '../../components/shader';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { appDay } from '../../core/days';
import { sprintProgress } from '../../core/home';
import { useBook } from '../../core/store';
import { firstName, useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import { haptics } from '../../utils/haptics';

/** The pace of one line: arrive, stay, leave. Slow on purpose. */
const IN = 1100;
const HOLD = 2600;
const OUT = 800;
/** A breath before the first line, while the colour settles. */
const FIRST_DELAY = 900;

const DEEP = '#DD5800';
const LIGHT = '#F9E0CB';

/**
 * The first moment after the vow. A deep saffron field whose light rises
 * and sinks from the bottom like a slow tide, a thought-orb turning above,
 * and a few lines that arrive and leave one at a time — a greeting, the
 * vow, the count — before the first plan.
 */
export function DayOneScreen({ navigation }: RootScreenProps<'DayOne'>) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const t = useT();
  const name = firstName(useProfile(s => s.name));
  const days = sprintProgress(useBook.getState(), appDay()).days;
  const [index, setIndex] = useState(0);
  const finished = useRef(false);

  const lines = useMemo(
    () => [
      t.dayOne.hey(name),
      t.dayOne.taken,
      t.dayOne.day(days),
      t.dayOne.bow,
      t.dayOne.plan,
    ],
    [t, name, days],
  );

  const enter = () => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    navigation.reset({
      index: 0,
      routes: [{ name: 'Plan', params: { first: true } }],
    });
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

  const arrive = useSharedValue(0);
  useEffect(() => {
    arrive.value = withTiming(1, { duration: 700 });
  }, [arrive]);
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
      {/* Deep saffron that churns slowly, its light rising and sinking
          from the bottom like a tide. */}
      <ShaderView
        preset="ember"
        width={width}
        height={height}
        colours={[DEEP, '#E46A10', '#F2A15F', LIGHT]}
        style={StyleSheet.absoluteFill}
      />

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
