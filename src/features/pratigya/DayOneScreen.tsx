import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import { sansDigits } from '../../components/Numerals';
import { ThinkingOrb } from '../../components/orb';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { today } from '../../utils/clock';
import { addDays, formatClock } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { firstName, useProfile } from '../account/store';
import { planFor, usePlanning } from '../planning/store';
import { useGoalProgress } from '../progress';

/** How long each line stays before it rises away. */
const HOLD = 1900;
/** The gradient is drawn taller than the screen so it can drift. */
const OVERSCAN = 1.4;
const DRIFT = 60;

/**
 * The first moment after the vow: a warm, drifting saffron field, a
 * thought-orb turning at the top, and a few lines that rise in and float
 * away one after another — a greeting, then why it matters, then the first
 * session — before the app opens. Tap anywhere to skip ahead.
 */
export function DayOneScreen({ navigation }: RootScreenProps<'DayOne'>) {
  const insets = useSafeAreaInsets();
  const name = firstName(useProfile(s => s.name));
  const progress = useGoalProgress();
  const planning = usePlanning();
  const first = planFor(planning, addDays(today(), 1)).sessions[0];
  const [height, setHeight] = useState(0);
  const [index, setIndex] = useState(0);
  const finished = useRef(false);

  const lines = useMemo(
    () => [
      name ? `Hey, ${name}` : 'Hey, warrior',
      'The vow is taken.',
      `Day 1 of ${progress.days}.`,
      'The bow is in your hands now.',
      first
        ? `First arrow: tomorrow, ${formatClock(first.slot.start)}.`
        : 'Your first arrow leaves tomorrow.',
    ],
    [name, progress.days, first],
  );

  const enter = () => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    haptics.confirm();
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (index < lines.length - 1) {
        haptics.selection();
        setIndex(i => i + 1);
      } else {
        enter();
      }
    }, HOLD);
    return () => clearTimeout(t);
    // `enter` only navigates once; re-arming on it would restart the beat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, lines.length]);

  // The colour field breathes slowly up and down.
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift]);
  const fieldStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -DRIFT + drift.value * DRIFT }],
  }));

  return (
    <Pressable
      testID="next-button"
      accessibilityRole="button"
      accessibilityLabel="Continue"
      accessibilityHint="Skips to the app"
      onPress={() => {
        if (index < lines.length - 1) {
          setIndex(i => i + 1);
        } else {
          enter();
        }
      }}
      style={styles.screen}
      onLayout={e => setHeight(e.nativeEvent.layout.height)}
    >
      {height ? (
        <Animated.View style={[styles.field, fieldStyle]} pointerEvents="none">
          <Svg width="100%" height={height * OVERSCAN}>
            <Defs>
              <LinearGradient id="greet" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#E05A00" />
                <Stop offset="0.26" stopColor="#E05E00" />
                <Stop offset="0.48" stopColor="#EA8B4C" />
                <Stop offset="0.72" stopColor="#F8DCC4" />
                <Stop offset="1" stopColor="#F8DCC4" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height={height * OVERSCAN} fill="url(#greet)" />
          </Svg>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeIn.delay(200).duration(motion.slow)}
        style={[styles.orb, { top: insets.top + 72 }]}
        pointerEvents="none"
      >
        <ThinkingOrb
          state="searching"
          size={64}
          displaySize={88}
          theme="light"
          tint={colors.white}
          accessibilityLabel="Laser Focus"
        />
      </Animated.View>

      <View style={styles.stage} pointerEvents="none">
        <Animated.Text
          key={index}
          entering={FadeInDown.duration(motion.slow).easing(motion.easeOut)}
          exiting={FadeOutUp.duration(motion.base).easing(
            Easing.in(Easing.quad),
          )}
          style={styles.line}
          accessibilityLiveRegion="polite"
        >
          {sansDigits(lines[index])}
        </Animated.Text>
      </View>

      <View
        style={[styles.dots, { bottom: insets.bottom + 40 }]}
        pointerEvents="none"
      >
        {lines.map((_, i) => (
          <View key={i} style={[styles.dot, i <= index && styles.dotOn]} />
        ))}
        <AppText variant="micro" style={styles.skip}>
          Tap to continue
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#E05A00',
    overflow: 'hidden',
  },
  field: {
    ...StyleSheet.absoluteFill,
    bottom: undefined,
  },
  orb: {
    position: 'absolute',
    alignSelf: 'center',
  },
  stage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.gutter + spacing.lg,
  },
  line: {
    ...typography.display,
    fontSize: 38,
    lineHeight: 44,
    color: colors.white,
    textAlign: 'center',
  },
  dots: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(150, 60, 10, 0.25)',
  },
  dotOn: {
    backgroundColor: '#B4501A',
  },
  skip: {
    marginLeft: spacing.sm,
    color: '#8F4214',
  },
});
