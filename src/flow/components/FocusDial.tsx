import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Line, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

const AnimatedLine = Animated.createAnimatedComponent(Line);

/** Ticks around the dial; each covers 1/72 of the session. */
const TICKS = 72;
const SIZE = 300;
const C = SIZE / 2;
const OUTER = 140;
const INNER = 108;
/** How far the ticks at the moving edge reach out. */
const SWELL = 7;
/** How many ticks the swell spreads across. */
const SWELL_SPREAD = 3.5;

const ANGLES = Array.from(
  { length: TICKS },
  (_, i) => (i / TICKS) * Math.PI * 2,
);

/**
 * The session dial: a ring of fine ticks, brighter at their outer ends. As
 * the session passes, the ticks turn saffron one by one, clockwise from the
 * top. Progress runs on the UI thread as one long linear timing, so the
 * sweep glides instead of stepping each second, and the ticks at its edge
 * swell outward a little so you can see where "now" is.
 */
export function FocusDial({
  elapsed,
  total,
  children,
}: {
  /** Seconds already passed. */
  elapsed: number;
  /** Seconds in the whole session. */
  total: number;
  /** Shown in the middle, e.g. the time left. */
  children?: React.ReactNode;
}) {
  const progress = useSharedValue(Math.min(1, elapsed / total));
  const intro = useSharedValue(0);

  // One long glide to the end on the UI thread's clock. It is only
  // restarted if the real time drifts from it (e.g. the phone slept).
  useEffect(() => {
    const expected = Math.min(1, elapsed / total);
    if (intro.value === 0 || Math.abs(progress.value - expected) > 0.01) {
      progress.value = expected;
      progress.value = withTiming(1, {
        duration: Math.max(0, (total - elapsed) * 1000),
        easing: Easing.linear,
      });
    }
    if (intro.value === 0) {
      intro.value = withTiming(1, {
        duration: 1400,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
    }
  }, [elapsed, total, progress, intro]);

  const introStyle = useAnimatedStyle(() => ({
    opacity: intro.value,
    transform: [
      { rotate: `${(1 - intro.value) * -18}deg` },
      { scale: 0.94 + intro.value * 0.06 },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[StyleSheet.absoluteFill, introStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient
              id="dial-rest"
              cx={C}
              cy={C}
              r={OUTER + SWELL}
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset={INNER / (OUTER + SWELL)}
                stopColor="#FFFFFF"
                stopOpacity="0.06"
              />
              <Stop
                offset={OUTER / (OUTER + SWELL)}
                stopColor="#FFFFFF"
                stopOpacity="0.62"
              />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.7" />
            </RadialGradient>
            <RadialGradient
              id="dial-done"
              cx={C}
              cy={C}
              r={OUTER + SWELL}
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset={INNER / (OUTER + SWELL)}
                stopColor={colors.saffron}
                stopOpacity="0.25"
              />
              <Stop
                offset={OUTER / (OUTER + SWELL)}
                stopColor={colors.saffron}
                stopOpacity="1"
              />
              <Stop offset="1" stopColor="#FFC27A" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          {ANGLES.map(a => (
            <Line
              key={`rest-${a}`}
              x1={C + INNER * Math.sin(a)}
              y1={C - INNER * Math.cos(a)}
              x2={C + OUTER * Math.sin(a)}
              y2={C - OUTER * Math.cos(a)}
              stroke="url(#dial-rest)"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          ))}
          {ANGLES.map((a, i) => (
            <DoneTick
              key={`done-${a}`}
              index={i}
              angle={a}
              progress={progress}
            />
          ))}
        </Svg>
      </Animated.View>
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

function DoneTick({
  index,
  angle,
  progress,
}: {
  index: number;
  angle: number;
  progress: SharedValue<number>;
}) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const props = useAnimatedProps(() => {
    // How far past this tick the sweep is, in ticks.
    const past = progress.value * TICKS - index;
    const lit = Math.min(1, Math.max(0, past));
    // Ticks near the edge of the sweep reach out a little further.
    const near = Math.max(0, 1 - Math.abs(past - 0.5) / SWELL_SPREAD);
    const swell = progress.value < 1 ? near * near * SWELL : 0;
    const outer = OUTER + swell;
    return {
      x2: C + outer * sin,
      y2: C - outer * cos,
      strokeOpacity: lit,
    };
  });
  return (
    <AnimatedLine
      x1={C + INNER * sin}
      y1={C - INNER * cos}
      x2={C + OUTER * sin}
      y2={C - OUTER * cos}
      stroke="url(#dial-done)"
      strokeWidth={2.2}
      strokeLinecap="round"
      animatedProps={props}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
