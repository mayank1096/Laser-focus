import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  LinearGradient,
  Polyline,
  Rect,
  Stop,
} from 'react-native-svg';
import Check from '../../assets/icons/check.svg';
import { AppText } from '../../components/AppText';
import type { Mark } from '../../core/model';
import { colors, springs } from '../../theme';
import type { ISODate } from '../../types/models';
import { fromISODate } from '../../utils/date';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

/** A full fill takes this long to hold. */
export const FILL_MS = 1500;

/** The two ends of the saffron fill: lit at the top, deep at the bottom. */
export const FILL_TOP = '#FFB45E';
export const FILL_BOTTOM = '#F27A10';
const EMPTY = 'rgba(0, 0, 0, 0.05)';
const WASH = 'rgba(250, 140, 34, 0.14)';

/** The zig-zag across a box of `w × h`, and its length for drawing it in. */
export function zigzag(w: number, h = w) {
  const pad = w * 0.2;
  const top = h * 0.36;
  const bottom = h * 0.64;
  const step = (w - pad * 2) / 4;
  const pts = Array.from({ length: 5 }, (_, i) => [
    pad + step * i,
    i % 2 === 0 ? bottom : top,
  ]);
  const seg = Math.hypot(step, bottom - top);
  return { points: pts.map(p => p.join(',')).join(' '), length: seg * 4 };
}

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
 * the bottom and a white tick settles in once it's full; `zig` (0–1) tints
 * the tile and draws a saffron zig-zag in from the left. Today wears a ring.
 */
export function Box({
  size,
  fill,
  zig,
  today = false,
}: {
  size: number;
  fill: SharedValue<number>;
  zig: SharedValue<number>;
  today?: boolean;
}) {
  const id = useRef(`box-fill-${++boxIds}`).current;
  const r = Math.round(size * 0.3);
  const { points, length } = zigzag(size);
  const fillStyle = useAnimatedStyle(() => ({
    height: `${fill.value * 100}%`,
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value, [0.85, 1], [0, 1], 'clamp'),
    transform: [
      { scale: interpolate(fill.value, [0.85, 1], [0.5, 1], 'clamp') },
    ],
  }));
  const washStyle = useAnimatedStyle(() => ({ opacity: zig.value }));
  const zigProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - zig.value),
    // A round cap would leave a dot where the line starts.
    strokeOpacity: zig.value > 0.001 ? 1 : 0,
  }));
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: r },
        today && styles.today,
      ]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.wash, washStyle]}
      />
      <Animated.View style={[styles.fill, fillStyle]}>
        <SaffronFill id={id} />
      </Animated.View>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <AnimatedPolyline
          points={points}
          fill="none"
          stroke={colors.saffron}
          strokeWidth={Math.max(1.8, size * 0.075)}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          animatedProps={zigProps}
        />
      </Svg>
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

/** A box showing a settled mark, animating when the mark changes. */
export function DayBox({
  size,
  mark,
  today = false,
  delay = 0,
}: {
  size: number;
  mark: Mark | null;
  today?: boolean;
  delay?: number;
}) {
  const fill = useSharedValue(mark === 'full' ? 1 : 0);
  const zig = useSharedValue(mark === 'half' ? 1 : 0);
  const pop = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      fill.value = withTiming(mark === 'full' ? 1 : 0, {
        duration: 700,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      zig.value = withTiming(mark === 'half' ? 1 : 0, { duration: 600 });
      pop.value = withSequence(
        withTiming(1.25, { duration: 220 }),
        withSpring(1, springs.morph),
      );
    }, delay);
    return () => clearTimeout(t);
  }, [mark, delay, fill, zig, pop]);
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));
  return (
    <Animated.View style={popStyle}>
      <Box size={size} fill={fill} zig={zig} today={today} />
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
}: {
  days: ISODate[];
  marks: (Mark | null)[];
  today: ISODate;
  letters: string[];
  size?: number;
  /** Lets one box animate a beat after something else does. */
  delayFor?: (day: ISODate) => number;
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
          />
          <AppText
            variant="micro"
            style={d === today ? styles.todayLetter : styles.letter}
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
  today: {
    borderWidth: 1.5,
    borderColor: colors.saffron,
  },
  wash: {
    backgroundColor: WASH,
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
  todayLetter: {
    color: colors.saffron,
  },
});
