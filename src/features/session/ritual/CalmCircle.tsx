import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, fonts } from '../../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 300;
const C = SIZE / 2;
/** The thin ring the progress travels along. */
const RING = 132;
const RING_LENGTH = 2 * Math.PI * RING;
/** The soft orb inside, at full size. */
const ORB = 112;

const TONES = {
  light: {
    core: '#FFE2C4',
    mid: colors.saffron,
    track: 'rgba(0, 0, 0, 0.06)',
    arc: colors.saffron,
    label: 'rgba(40, 20, 6, 0.86)',
    sub: 'rgba(40, 20, 6, 0.5)',
  },
  dark: {
    core: '#FFB277',
    mid: '#E25E00',
    track: 'rgba(255, 255, 255, 0.08)',
    arc: 'rgba(255, 255, 255, 0.7)',
    label: 'rgba(255, 255, 255, 0.9)',
    sub: 'rgba(255, 255, 255, 0.5)',
  },
} as const;

/**
 * A calm, blurred orb inside a fine ring. The orb swells and settles with
 * `level` (0–1); the ring fills clockwise with `progress` (0–1). One small
 * word sits in the middle, a smaller line under it. Shared by the
 * breathing and tratak steps so the ritual has one visual language.
 */
export function CalmCircle({
  level,
  progress,
  label,
  sub,
  tone = 'light',
}: {
  level: SharedValue<number>;
  progress: SharedValue<number>;
  label: string;
  sub?: string;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  const orbStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + level.value * 0.28,
    transform: [{ scale: 0.7 + level.value * 0.3 }],
  }));
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_LENGTH * (1 - progress.value),
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[StyleSheet.absoluteFill, orbStyle]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id={`calm-${tone}`} cx="50%" cy="46%" r="50%">
              <Stop offset="0" stopColor={t.core} stopOpacity="0.95" />
              <Stop offset="0.45" stopColor={t.mid} stopOpacity="0.55" />
              <Stop offset="0.8" stopColor={t.mid} stopOpacity="0.14" />
              <Stop offset="1" stopColor={t.mid} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={C} cy={C} r={ORB} fill={`url(#calm-${tone})`} />
        </Svg>
      </Animated.View>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={C}
          cy={C}
          r={RING}
          fill="none"
          stroke={t.track}
          strokeWidth={2}
        />
        <AnimatedCircle
          cx={C}
          cy={C}
          r={RING}
          fill="none"
          stroke={t.arc}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`}
          animatedProps={arcProps}
          transform={`rotate(-90 ${C} ${C})`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.label, { color: t.label }]}>{label}</Text>
        {sub ? <Text style={[styles.sub, { color: t.sub }]}>{sub}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
});
