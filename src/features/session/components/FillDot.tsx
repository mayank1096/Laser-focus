import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../../../theme';

const DEEP = '#E0740F';

/**
 * A circle that holds liquid saffron. `level` (0–1) is how full it is; the
 * surface is a slow wave that keeps drifting, so even a half-filled day
 * looks alive rather than broken. Used big for today's mark and small for
 * the days of the week.
 */
export function FillDot({
  size,
  level,
  still = false,
  ring = 'rgba(0, 0, 0, 0.12)',
}: {
  size: number;
  level: SharedValue<number>;
  /** Skip the drifting wave (for the small week dots). */
  still?: boolean;
  ring?: string;
}) {
  const drift = useSharedValue(0);
  useEffect(() => {
    if (still) {
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [drift, still]);

  const amp = Math.max(1.5, size * 0.035);
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - level.value) * (size + amp * 2) - amp }],
    opacity: level.value > 0.001 ? 1 : 0,
  }));
  const waveStyle = useAnimatedStyle(() => {
    const l = level.value;
    // The wave flattens out as the circle empties or fills to the brim.
    const swell = Math.min(1, Math.min(l, 1 - l) * 6);
    return {
      transform: [{ translateX: -drift.value * size }, { scaleY: swell }],
    };
  });

  // One wavelength per circle width, drawn twice so it can loop.
  const w = size * 2;
  let d = `M0 ${amp}`;
  for (let x = 0; x <= w; x += size / 16) {
    d += ` L${x} ${amp - Math.sin((x / size) * Math.PI * 2) * amp}`;
  }
  d += ` L${w} ${amp * 2 + 1} L0 ${amp * 2 + 1} Z`;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: ring,
        },
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
        <Animated.View style={[styles.wave, { height: amp * 2 }, waveStyle]}>
          <Svg width={w} height={amp * 2 + 1}>
            <Path d={d} fill={colors.saffron} />
          </Svg>
        </Animated.View>
        <Svg width={size} height={size + amp * 2} style={styles.body}>
          <Defs>
            <LinearGradient id={`fill-${size}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.saffron} />
              <Stop offset="1" stopColor={DEEP} />
            </LinearGradient>
          </Defs>
          <Rect
            width={size}
            height={size + amp * 2}
            fill={`url(#fill-${size})`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  body: {
    marginTop: -1,
  },
  wave: {
    width: '200%',
    transformOrigin: 'bottom',
  },
});
