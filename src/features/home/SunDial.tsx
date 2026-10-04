import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import { colors, motion } from '../../theme';

export type ArcState = 'done' | 'half' | 'ahead' | 'missed';

export interface DialArc {
  id: string;
  /** Hours since midnight, e.g. 14.5 for 2:30 PM. */
  from: number;
  to: number;
  state: ArcState;
}

export interface SunDialProps {
  size: number;
  arcs: DialArc[];
  /** The shallow-work hour, drawn as a thin dark line. */
  shallow?: { from: number; to: number };
  /** Hours since midnight, for the laser hand. */
  now: number;
  children?: React.ReactNode;
}

const RING = 12;

/**
 * The day as a sun path: noon at the top, midnight at the bottom, sunrise
 * on the left. Sessions sit where they really happen; a laser hand marks now.
 * The hand's tip is the screen's one point of light.
 */
export function SunDial({ size, arcs, shallow, now, children }: SunDialProps) {
  const C = size / 2;
  const R = C - 22;
  const angle = (h: number) => ((h / 24) * 360 + 180) % 360;
  const pt = (r: number, h: number) => {
    const a = (angle(h) * Math.PI) / 180;
    return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
  };
  const arc = (r: number, h1: number, h2: number) => {
    const [x1, y1] = pt(r, h1);
    const [x2, y2] = pt(r, h2);
    const span = (((h2 - h1 + 24) % 24) / 24) * 360;
    return `M${x1} ${y1} A${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${x2} ${y2}`;
  };

  // The hand sweeps from noon to now when the screen opens.
  const sweep = useSharedValue(0);
  const fade = useSharedValue(0);
  useEffect(() => {
    fade.value = withTiming(1, {
      duration: motion.slow,
      easing: motion.easeOut,
    });
    sweep.value = withDelay(
      200,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }),
    );
  }, [fade, sweep]);
  const nowAngle = angle(now);
  // Sweep the short way round from noon (0deg) to the current angle.
  const target = nowAngle > 180 ? nowAngle - 360 : nowAngle;
  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${target * sweep.value}deg` }],
    opacity: fade.value,
  }));
  const dialStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ scale: 0.96 + fade.value * 0.04 }],
  }));

  const ticks = [];
  for (let q = 0; q < 96; q++) {
    if (q % 24 === 0) {
      continue;
    }
    const hour = q % 4 === 0;
    const r2 = R - 16;
    const r1 = r2 - (hour ? 4 : 1.5);
    const [a, b] = pt(r1, q / 4);
    const [c, d] = pt(r2, q / 4);
    ticks.push(
      <Line
        key={q}
        x1={a}
        y1={b}
        x2={c}
        y2={d}
        stroke="#000"
        strokeOpacity={hour ? 0.22 : 0.09}
        strokeWidth={1}
        strokeLinecap="round"
      />,
    );
  }

  const labels: [string, number][] = [
    ['NOON', 12],
    ['6 AM', 6],
    ['6 PM', 18],
    ['NIGHT', 0],
  ];

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, dialStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke="#000"
            strokeOpacity={0.055}
            strokeWidth={RING}
          />
          <Path
            d={arc(R, 22, 5)}
            fill="none"
            stroke="#000"
            strokeOpacity={0.05}
            strokeWidth={RING}
          />
          {ticks}
          {shallow ? (
            <Path
              d={arc(R, shallow.from, shallow.to)}
              fill="none"
              stroke={colors.charcoal}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ) : null}
          {arcs.map(a => (
            <Path
              key={a.id}
              d={arc(R, a.from, a.to)}
              fill="none"
              stroke={a.state === 'missed' ? '#000' : colors.saffron}
              strokeOpacity={
                a.state === 'done'
                  ? 1
                  : a.state === 'half'
                  ? 0.6
                  : a.state === 'missed'
                  ? 0.18
                  : 0.3
              }
              strokeWidth={RING}
              strokeLinecap="round"
            />
          ))}
        </Svg>
        {labels.map(([label, h]) => {
          const [x, y] = pt(R - 34, h);
          return (
            <AppText
              key={label}
              variant="micro"
              style={[styles.label, { left: x - 30, top: y - 6 }]}
            >
              {label}
            </AppText>
          );
        })}
      </Animated.View>

      {/* The laser hand, rotated around the centre. */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, handStyle]}
      >
        <Svg width={size} height={size}>
          <Line
            x1={C}
            y1={C - 56}
            x2={C}
            y2={C - R - 12}
            stroke={colors.saffron}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <Circle
            cx={C}
            cy={C - R - 12}
            r={12}
            fill={colors.saffron}
            fillOpacity={0.18}
          />
          <Circle cx={C} cy={C - R - 12} r={4} fill={colors.saffron} />
        </Svg>
      </Animated.View>

      <View pointerEvents="box-none" style={styles.center}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    width: 60,
    textAlign: 'center',
    fontSize: 8,
    letterSpacing: 1.6,
    color: colors.textFaint,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
