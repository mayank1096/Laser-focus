import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { sansDigits } from '../../components/Numerals';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, springs, typography } from '../../theme';
import { today as todayISO } from '../../utils/clock';
import {
  addDays,
  formatClock,
  fromISODate,
  startOfWeek,
} from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { planFor, usePlanning } from '../planning/store';
import { useStreak } from '../progress';
import { FillDot } from './components/FillDot';
import { dayMark, useSessions, type DayMark } from './store';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BIG = 188;
const SMALL = 30;
/** A full fill takes this long to hold; a half fill, half as long. */
const HOLD_MS = 1800;

const levelOf = (m: DayMark | 'pending') =>
  m === 'full' ? 1 : m === 'half' ? 0.5 : 0;

/**
 * After a session: today's mark is an empty circle, and you fill it
 * yourself. Press and hold, and saffron rises in it like water — all the
 * way for a full mark, to the middle for a half. Let go early and it drains.
 * When it's full, the circle settles, today's dot in the week fills to
 * match, and only then do the words arrive.
 */
export function StreakMarkScreen({
  navigation,
  route,
}: RootScreenProps<'StreakMark'>) {
  const { date } = route.params;
  const insets = useSafeAreaInsets();
  const sessions = useSessions();
  const planning = usePlanning();
  const streak = useStreak();
  const today = todayISO();
  const mark = dayMark(sessions, planning, date, today);
  const target = levelOf(mark);
  const fillable = target > 0;
  const monday = startOfWeek(date);
  const next = planFor(planning, date).sessions.find(
    s => s.task && !sessions.results[date]?.[s.slot.id],
  );

  const [filled, setFilled] = useState(!fillable);
  // The press handlers can outlive a render, so they read this, not state.
  const isFilled = useRef(!fillable);
  const level = useSharedValue(0);
  const settle = useSharedValue(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const complete = () => {
    if (isFilled.current) {
      return;
    }
    isFilled.current = true;
    clear();
    level.value = withTiming(target, { duration: 300 });
    settle.value = withSequence(
      withTiming(1.06, { duration: 180, easing: motion.easeOut }),
      withSpring(1, springs.morph),
    );
    haptics.success();
    setFilled(true);
  };

  const pressIn = () => {
    if (isFilled.current) {
      return;
    }
    const ms = HOLD_MS * target;
    level.value = withTiming(target, {
      duration: ms * (1 - level.value / target),
      easing: Easing.bezier(0.33, 0, 0.67, 1),
    });
    haptics.tap();
    // Soft ticks while it rises, so the hold feels like it is building.
    for (let t = 300; t < ms; t += 300) {
      timers.current.push(setTimeout(() => haptics.selection(), t));
    }
    timers.current.push(setTimeout(complete, ms));
  };

  const pressOut = () => {
    if (isFilled.current) {
      return;
    }
    clear();
    level.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
  };

  const copy =
    mark === 'full'
      ? { title: 'Full mark.', sub: 'One arrow closer to the eye.' }
      : mark === 'half'
      ? { title: 'Half mark.', sub: 'You showed up. The streak holds.' }
      : next
      ? { title: 'Not yet.', sub: 'One more arrow today. It still counts.' }
      : {
          title: 'No mark today.',
          sub: 'Tomorrow, sit ten minutes at least. That is the floor.',
        };

  const bigStyle = useAnimatedStyle(() => ({
    transform: [{ scale: settle.value }],
    boxShadow: `0px 0px ${24 + level.value * 40}px rgba(250, 140, 34, ${
      0.12 + level.value * 0.38
    })`,
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 40 }]}>
      <Animated.Text
        entering={FadeIn.duration(motion.slow)}
        style={[typography.eyebrow, styles.center]}
      >
        {`Day ${streak}`}
      </Animated.Text>

      <View style={styles.hero}>
        <Pressable
          testID="mark-fill"
          accessibilityRole="button"
          accessibilityLabel="Hold to fill today's mark"
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={complete}
          disabled={!fillable || filled}
          onPressIn={pressIn}
          onPressOut={pressOut}
        >
          <Animated.View
            entering={FadeIn.delay(200).duration(motion.cinematic)}
            style={[styles.big, bigStyle]}
          >
            <FillDot size={BIG} level={level} ring="rgba(0, 0, 0, 0.1)" />
          </Animated.View>
        </Pressable>

        <View style={styles.words}>
          {filled ? (
            <>
              <Animated.Text
                entering={FadeInDown.delay(250).duration(motion.slow)}
                style={[styles.title, styles.center]}
              >
                {sansDigits(copy.title)}
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(400).duration(motion.slow)}
                style={[typography.body, styles.center, styles.muted]}
              >
                {copy.sub}
              </Animated.Text>
            </>
          ) : (
            <Animated.Text
              entering={FadeIn.delay(700).duration(motion.slow)}
              style={[styles.prompt, styles.center]}
            >
              Hold to fill today
            </Animated.Text>
          )}
        </View>
      </View>

      <View style={styles.week}>
        {LETTERS.map((l, i) => {
          const d = addDays(monday, i);
          const m = d > today ? 'empty' : dayMark(sessions, planning, d, today);
          const isToday = d === date;
          return (
            <WeekDot
              key={d}
              letter={l}
              level={isToday ? (filled ? target : 0) : levelOf(m)}
              isToday={isToday}
            />
          );
        })}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
        {filled && next ? (
          <Animated.View
            entering={FadeIn.delay(700).duration(motion.slow)}
            style={styles.next}
          >
            <AppText variant="micro" style={styles.muted}>
              {`Next · ${formatClock(next.slot.start)} · ${next.task?.text}`}
            </AppText>
          </Animated.View>
        ) : null}
        {filled ? (
          <Animated.View entering={FadeInDown.delay(600).duration(motion.slow)}>
            <PrimaryButton
              testID="next-button"
              label="Done"
              onPress={() =>
                next || fromISODate(date) < fromISODate(today)
                  ? navigation.reset({
                      index: 0,
                      routes: [{ name: 'Main', params: { tab: 'today' } }],
                    })
                  : navigation.reset({ index: 0, routes: [{ name: 'Rest' }] })
              }
            />
          </Animated.View>
        ) : (
          <View style={styles.buttonSpace} />
        )}
      </View>
    </View>
  );
}

/** One day of the week; today's fills a beat after the big circle does. */
function WeekDot({
  letter,
  level,
  isToday,
}: {
  letter: string;
  level: number;
  isToday: boolean;
}) {
  const fill = useSharedValue(isToday ? 0 : level);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!isToday || level === 0) {
      return;
    }
    fill.value = withDelay(
      350,
      withTiming(level, { duration: 700, easing: motion.easeOut }),
    );
    pop.value = withDelay(
      350,
      withSequence(
        withTiming(1.25, { duration: 220, easing: motion.easeOut }),
        withSpring(1, springs.morph),
      ),
    );
  }, [isToday, level, fill, pop]);
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));
  return (
    <View style={styles.day}>
      <Animated.View style={popStyle}>
        <FillDot
          size={SMALL}
          level={fill}
          still
          ring={isToday ? colors.saffron : 'rgba(0, 0, 0, 0.12)'}
        />
      </Animated.View>
      <AppText
        variant="micro"
        style={isToday ? styles.todayLetter : styles.muted}
      >
        {letter}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
    paddingHorizontal: spacing.gutter,
  },
  center: {
    textAlign: 'center',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  big: {
    borderRadius: BIG / 2,
  },
  words: {
    marginTop: 36,
    minHeight: 96,
    alignItems: 'center',
    gap: spacing.sm,
  },
  prompt: {
    ...typography.label,
    color: colors.textMuted,
  },
  title: {
    ...typography.display,
  },
  muted: {
    color: colors.textMuted,
  },
  week: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: 36,
  },
  day: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  todayLetter: {
    color: colors.saffron,
  },
  footer: {
    gap: spacing.lg,
  },
  next: {
    alignItems: 'center',
  },
  buttonSpace: {
    height: 64,
  },
});
