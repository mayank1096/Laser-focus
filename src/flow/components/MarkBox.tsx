import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Check from '../../assets/icons/check.svg';
import { AppText } from '../../components/AppText';
import type { Mark } from '../../core/model';
import { colors, springs } from '../../theme';
import type { ISODate } from '../../types/models';
import { fromISODate } from '../../utils/date';

/** A full fill takes this long to hold. */
export const FILL_MS = 1500;

/** The two ends of the saffron fill: lit at the top, deep at the bottom. */
export const FILL_TOP = '#FFB45E';
export const FILL_BOTTOM = '#F27A10';
const EMPTY = 'rgba(0, 0, 0, 0.05)';

/** The saffron that rises inside a box or card, lit from above. */
export function SaffronFill({ id }: { id: string }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={FILL_TOP} />
          <Stop offset="1" stopColor={FILL_BOTTOM} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

let boxIds = 0;

/**
 * One day's box. Empty is a faint tile; `fill` (0–1) raises saffron from
 * the bottom: half way for a half day, all the way for a full one, where a
 * white tick settles in. Today wears a ring.
 */
export function Box({
  size,
  fill,
  today = false,
  dark = false,
}: {
  size: number;
  fill: SharedValue<number>;
  today?: boolean;
  /** On the haze: an empty box is a faint white, not a faint black. */
  dark?: boolean;
}) {
  const id = useRef(`box-fill-${++boxIds}`).current;
  const r = Math.round(size * 0.3);
  const fillStyle = useAnimatedStyle(() => ({
    height: `${fill.value * 100}%`,
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value, [0.85, 1], [0, 1], 'clamp'),
    transform: [
      { scale: interpolate(fill.value, [0.85, 1], [0.5, 1], 'clamp') },
    ],
  }));
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: r },
        dark && styles.boxDark,
        today && styles.today,
      ]}
    >
      <Animated.View style={[styles.fill, fillStyle]}>
        <SaffronFill id={id} />
      </Animated.View>
      <Animated.View style={[styles.tick, tickStyle]} pointerEvents="none">
        <Check
          width={size * 0.5}
          height={size * 0.5}
          color={colors.white}
          strokeWidth={2.6}
        />
      </Animated.View>
    </View>
  );
}

/** How far a mark fills its box: all, half, or none. */
export const levelOf = (mark: Mark | null) =>
  mark === 'full' ? 1 : mark === 'half' ? 0.5 : 0;

/** A box showing a settled mark, animating when the mark changes. */
export function DayBox({
  size,
  mark,
  today = false,
  delay = 0,
  dark = false,
}: {
  size: number;
  mark: Mark | null;
  today?: boolean;
  delay?: number;
  dark?: boolean;
}) {
  const fill = useSharedValue(levelOf(mark));
  const pop = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      fill.value = withTiming(levelOf(mark), {
        duration: 700,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      pop.value = withSequence(
        withTiming(1.25, { duration: 220 }),
        withSpring(1, springs.morph),
      );
    }, delay);
    return () => clearTimeout(t);
  }, [mark, delay, fill, pop]);
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));
  return (
    <Animated.View style={popStyle}>
      <Box size={size} fill={fill} today={today} dark={dark} />
    </Animated.View>
  );
}

/** The last seven days, today on the right. */
export function WeekRow({
  days,
  marks,
  today,
  letters,
  size = 34,
  delayFor,
  dark = false,
}: {
  days: ISODate[];
  marks: (Mark | null)[];
  today: ISODate;
  letters: string[];
  size?: number;
  /** Lets one box animate a beat after something else does. */
  delayFor?: (day: ISODate) => number;
  dark?: boolean;
}) {
  return (
    <View style={styles.row} accessibilityRole="summary">
      {days.map((d, i) => (
        <View key={d} style={styles.day}>
          <DayBox
            size={size}
            mark={marks[i]}
            today={d === today}
            delay={delayFor?.(d) ?? 0}
            dark={dark}
          />
          <AppText
            variant="micro"
            style={
              d === today
                ? styles.todayLetter
                : dark
                ? styles.letterDark
                : styles.letter
            }
          >
            {letters[fromISODate(d).getDay()]}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: EMPTY,
  },
  boxDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.saffron,
  },
  fill: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  tick: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 8,
  },
  letter: {
    color: colors.textMuted,
  },
  letterDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  todayLetter: {
    color: colors.saffron,
  },
});
