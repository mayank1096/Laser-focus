import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import type { Mark } from '../../core/model';
import { colors, springs } from '../../theme';
import type { ISODate } from '../../types/models';
import { fromISODate } from '../../utils/date';
import { haptics } from '../../utils/haptics';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

/** A full fill takes this long to hold. */
export const FILL_MS = 1500;

/** The zig-zag across a box of `size`, and its length for drawing it in. */
function zigzag(size: number) {
  const pad = size * 0.17;
  const top = size * 0.34;
  const bottom = size * 0.66;
  const step = (size - pad * 2) / 4;
  const pts = Array.from({ length: 5 }, (_, i) => [
    pad + step * i,
    i % 2 === 0 ? bottom : top,
  ]);
  const seg = Math.hypot(step, bottom - top);
  return { points: pts.map(p => p.join(',')).join(' '), length: seg * 4 };
}

/**
 * One box, like the paper calendar's. `fill` (0–1) raises saffron from the
 * bottom; `zig` (0–1) draws the zig-zag in from the left.
 */
export function Box({
  size,
  fill,
  zig,
  ring = colors.border,
  radius,
}: {
  size: number;
  fill: SharedValue<number>;
  zig: SharedValue<number>;
  ring?: string;
  radius?: number;
}) {
  const r = radius ?? Math.max(4, size * 0.16);
  const { points, length } = zigzag(size);
  const fillStyle = useAnimatedStyle(() => ({
    height: `${fill.value * 100}%`,
  }));
  const zigProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - zig.value),
  }));
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size, borderRadius: r, borderColor: ring },
      ]}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <AnimatedPolyline
          points={points}
          fill="none"
          stroke={colors.ink}
          strokeWidth={Math.max(1.6, size * 0.06)}
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          animatedProps={zigProps}
        />
      </Svg>
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
        duration: 600,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
      zig.value = withTiming(mark === 'half' ? 1 : 0, { duration: 600 });
      pop.value = withSequence(
        withTiming(1.2, { duration: 200 }),
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
      <Box
        size={size}
        fill={fill}
        zig={zig}
        ring={today ? colors.saffron : colors.border}
      />
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

/**
 * The big box on the Mark screen. Hold to fill it to ●; swipe across to
 * draw the zig-zag. Letting go early drains it.
 */
export function MarkPad({
  size,
  onMark,
  locked,
  fill,
  zig,
}: {
  size: number;
  onMark: (mark: Exclude<Mark, 'empty'>) => void;
  locked: boolean;
  fill: SharedValue<number>;
  zig: SharedValue<number>;
}) {
  const done = useRef(locked);
  done.current = locked;
  const ticks = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTicks = () => {
    if (ticks.current) {
      clearInterval(ticks.current);
      ticks.current = null;
    }
  };
  useEffect(() => stopTicks, []);

  const hold = Gesture.LongPress()
    .runOnJS(true)
    .minDuration(FILL_MS)
    .maxDistance(14)
    .onBegin(() => {
      if (done.current) {
        return;
      }
      haptics.tap();
      zig.value = withTiming(0, { duration: 150 });
      fill.value = withTiming(1, {
        duration: FILL_MS * (1 - fill.value),
        easing: Easing.bezier(0.33, 0, 0.67, 1),
      });
      stopTicks();
      ticks.current = setInterval(() => haptics.selection(), 300);
    })
    .onStart(() => {
      if (done.current) {
        return;
      }
      stopTicks();
      fill.value = 1;
      haptics.success();
      onMark('full');
    })
    .onFinalize((_e, success) => {
      stopTicks();
      if (!success && !done.current) {
        fill.value = withTiming(0, { duration: 400 });
      }
    });

  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12])
    .onUpdate(e => {
      if (done.current) {
        return;
      }
      fill.value = 0;
      zig.value = Math.min(1, Math.abs(e.translationX) / (size * 0.75));
    })
    .onEnd(() => {
      if (done.current) {
        return;
      }
      if (zig.value > 0.6) {
        zig.value = withTiming(1, { duration: 150 });
        haptics.success();
        onMark('half');
      } else {
        zig.value = withTiming(0, { duration: 250 });
      }
    });

  return (
    <GestureDetector gesture={Gesture.Race(swipe, hold)}>
      <View collapsable={false} testID="mark-pad" accessibilityRole="adjustable">
        <Box size={size} fill={fill} zig={zig} ring={colors.ink} radius={22} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.white,
  },
  fill: {
    alignSelf: 'stretch',
    backgroundColor: colors.saffron,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 6,
  },
  letter: {
    color: colors.textMuted,
  },
  todayLetter: {
    color: colors.saffron,
  },
});
