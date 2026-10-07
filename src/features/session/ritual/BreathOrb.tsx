import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ThinkingOrb } from '../../../components/orb';
import { colors, fonts } from '../../../theme';

/** The orb's drawn size at full breath; it rests at REST of this. */
const ORB = 200;
const REST = 0.58;
const GLOW = 340;

const TONES = {
  light: {
    glow: colors.saffron,
    glowOpacity: 0.32,
    label: 'rgba(40, 20, 6, 0.82)',
    sub: 'rgba(40, 20, 6, 0.45)',
  },
  dark: {
    glow: '#E25E00',
    glowOpacity: 0.42,
    label: 'rgba(255, 255, 255, 0.86)',
    sub: 'rgba(255, 255, 255, 0.45)',
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
}: {
  level: SharedValue<number>;
  label: string;
  sub?: string;
  tone?: keyof typeof TONES;
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
          <Svg width={GLOW} height={GLOW}>
            <Defs>
              <RadialGradient id={`breath-${tone}`} cx="50%" cy="50%" r="50%">
                <Stop
                  offset="0"
                  stopColor={t.glow}
                  stopOpacity={t.glowOpacity}
                />
                <Stop
                  offset="0.55"
                  stopColor={t.glow}
                  stopOpacity={t.glowOpacity * 0.35}
                />
                <Stop offset="1" stopColor={t.glow} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle
              cx={GLOW / 2}
              cy={GLOW / 2}
              r={GLOW / 2}
              fill={`url(#breath-${tone})`}
            />
          </Svg>
        </Animated.View>
        <Animated.View style={orbStyle}>
          <ThinkingOrb
            state="breathing"
            size={64}
            displaySize={ORB}
            speed={0.55}
            theme={tone}
            tint={colors.saffron}
            accessibilityLabel={label}
          />
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
