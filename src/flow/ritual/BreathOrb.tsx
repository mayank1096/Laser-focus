import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { ThinkingOrb, type OrbState } from '../../components/orb';
import { ShaderView } from '../../components/shader';
import { colors, fonts } from '../../theme';

/** The orb's drawn size at full breath; it rests at REST of this. */
const ORB = 200;
const REST = 0.58;
const GLOW = 340;

const TONES = {
  light: {
    glow: ['#FBD9B8', '#FFB877', '#FA8C22'],
    label: 'rgba(40, 20, 6, 0.82)',
    sub: 'rgba(40, 20, 6, 0.45)',
  },
  dark: {
    glow: ['#3A1206', '#8A3208', '#E25E00'],
    label: 'rgba(255, 255, 255, 0.86)',
    sub: 'rgba(255, 255, 255, 0.45)',
  },
  /** On the saffron haze: a white orb in a pale glow, so it reads. */
  mist: {
    glow: ['#B04A18', '#D9824E', '#EDB48C'],
    label: 'rgba(255, 255, 255, 0.92)',
    sub: 'rgba(255, 255, 255, 0.6)',
  },
} as const;

/**
 * A living orb that breathes with you. `level` (0–1) is the breath: the orb
 * and its warm glow swell to full on the in-breath and settle back to rest
 * on the out-breath, so the motion itself is the instruction. A small word
 * and count sit underneath, never on top of it.
 */
export function BreathOrb({
  level,
  label,
  sub,
  tone = 'light',
  state = 'breathing',
  speed = 0.55,
  tint = colors.saffron,
}: {
  level: SharedValue<number>;
  label: string;
  sub?: string;
  tone?: keyof typeof TONES;
  /** Which orb to draw; the breathing ring by default. */
  state?: OrbState;
  speed?: number;
  tint?: string;
}) {
  const t = TONES[tone];
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: REST + level.value * (1 - REST) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + level.value * 0.65,
    transform: [{ scale: 0.55 + level.value * 0.45 }],
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <ShaderView
            preset="glow"
            width={GLOW}
            height={GLOW}
            colours={t.glow}
          />
        </Animated.View>
        <Animated.View style={orbStyle}>
          {tone === 'mist' ? (
            // The dotted orb mixes its faint dots towards black, which
            // reads grey on the haze; a plain white ring stays clear.
            <View
              style={styles.ring}
              accessibilityRole="image"
              accessibilityLabel={label}
            >
              <View style={styles.core} />
            </View>
          ) : (
            <ThinkingOrb
              state={state}
              size={64}
              displaySize={ORB}
              speed={speed}
              theme={tone}
              tint={tint}
              accessibilityLabel={label}
            />
          )}
        </Animated.View>
      </View>
      <Text style={[styles.label, { color: t.label }]}>{label}</Text>
      {sub ? <Text style={[styles.sub, { color: t.sub }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  stage: {
    width: GLOW,
    height: GLOW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  ring: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: ORB * 0.62,
    height: ORB * 0.62,
    borderRadius: ORB * 0.31,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  label: {
    marginTop: 8,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  sub: {
    marginTop: 4,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
});
