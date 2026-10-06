import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Saffron, coral, marigold and lilac — warm, with one cool note. */
const HUES = ['#FA8C22', '#FF6F61', '#F7C948', '#B79CFF'];
const LOOP = 7000;

/**
 * A pill whose edge and wash carry a slow, many-coloured gradient that
 * drifts sideways forever. The strip is two periods wide and slides by one,
 * so the loop has no seam.
 */
export function GradientPill({
  children,
  style,
  radius = 10,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  radius?: number;
}) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!width) {
      return;
    }
    x.value = 0;
    x.value = withRepeat(
      withTiming(-width, { duration: LOOP, easing: Easing.linear }),
      -1,
      false,
    );
  }, [width, x]);

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const stops = [...HUES, ...HUES, HUES[0]];

  return (
    <View
      style={[styles.outer, { borderRadius: radius }, style]}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
    >
      {width ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.strip, { width: width * 2 }, stripStyle]}
        >
          <Svg width={width * 2} height="100%">
            <Defs>
              <LinearGradient id="pill-hues" x1="0" y1="0" x2="1" y2="0">
                {stops.map((c, i) => (
                  <Stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width={width * 2} height="100%" fill="url(#pill-hues)" />
          </Svg>
        </Animated.View>
      ) : null}
      <View style={[styles.inner, { borderRadius: radius - 1.5 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    padding: 1.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  strip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    // Mostly white, so the colours only tint the wash and glow at the edge.
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
  },
});
