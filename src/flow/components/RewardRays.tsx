import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

const RAYS = 14;

/** Tapered wedges fanned round the centre, like light behind a prize. */
function wedges(size: number) {
  const c = size / 2;
  const r = size / 2;
  const step = (Math.PI * 2) / RAYS;
  const half = step * 0.22;
  return Array.from({ length: RAYS }, (_, i) => {
    const a = i * step;
    const x1 = c + r * Math.cos(a - half);
    const y1 = c + r * Math.sin(a - half);
    const x2 = c + r * Math.cos(a + half);
    const y2 = c + r * Math.sin(a + half);
    return `M${c} ${c}L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(
      1,
    )} ${y2.toFixed(1)}Z`;
  });
}

/**
 * The game-reward burst behind the card: a fan of light that bursts open
 * as the card lands, then keeps turning slowly. `flare` (0–1) brightens
 * it, e.g. when the card fills.
 */
export function RewardRays({
  size,
  delay,
  flare,
}: {
  size: number;
  /** When the card lands, in ms. */
  delay: number;
  flare: SharedValue<number>;
}) {
  const open = useSharedValue(0);
  const turn = useSharedValue(0);
  useEffect(() => {
    open.value = withDelay(
      delay,
      withSequence(
        withTiming(1.15, { duration: 380, easing: Easing.out(Easing.cubic) }),
        withSpring(1, { damping: 14, stiffness: 120 }),
      ),
    );
    turn.value = withRepeat(
      withTiming(1, { duration: 40000, easing: Easing.linear }),
      -1,
    );
  }, [open, turn, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, open.value) * (0.45 + flare.value * 0.5),
    transform: [
      { rotate: `${turn.value * 360}deg` },
      { scale: 0.3 + open.value * 0.7 + flare.value * 0.12 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size }, style]}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="rays" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFF4E0" stopOpacity={0.95} />
            <Stop offset="0.35" stopColor="#FFC37A" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#FA8C22" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <G>
          {wedges(size).map((d, i) => (
            <Path key={i} d={d} fill="url(#rays)" />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
  },
});
