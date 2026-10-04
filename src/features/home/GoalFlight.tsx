import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import { colors, motion, spacing } from '../../theme';

/**
 * A goal as an arrow in flight toward its target. Milestones are notches
 * on the way; the saffron head is where you are now.
 */
export function GoalFlight({
  label,
  progress,
  notches,
  left,
  right,
}: {
  label: string;
  /** 0–1 */
  progress: number;
  /** 0–1 positions of milestone ends. */
  notches: number[];
  left: string;
  right: string;
}) {
  const [width, setWidth] = useState(0);
  const p = Math.max(0.02, Math.min(1, progress));
  const travel = useSharedValue(0);
  useEffect(() => {
    travel.value = withDelay(
      400,
      withTiming(1, { duration: 1100, easing: motion.easeOut }),
    );
  }, [travel]);
  const headStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (width * p - 2) * travel.value }],
  }));
  const shaftStyle = useAnimatedStyle(() => ({
    width: width * p * travel.value,
  }));

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`${label}. ${left}. ${right}.`}
    >
      <AppText variant="eyebrow">{label}</AppText>
      <View
        style={styles.track}
        onLayout={e => setWidth(e.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <>
            <Svg width={width} height={24} style={StyleSheet.absoluteFill}>
              <Line
                x1={0}
                y1={12}
                x2={width - 14}
                y2={12}
                stroke="#000"
                strokeOpacity={0.14}
                strokeWidth={1.5}
                strokeDasharray="1 5"
                strokeLinecap="round"
              />
              <Path
                d="M2 7 L8 12 L2 17 M8 7 L14 12 L8 17"
                fill="none"
                stroke={colors.charcoal}
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {notches.map(n => (
                <Line
                  key={n}
                  x1={width * n}
                  y1={8}
                  x2={width * n}
                  y2={16}
                  stroke="#000"
                  strokeOpacity={0.25}
                  strokeWidth={1.2}
                  strokeLinecap="round"
                />
              ))}
              <Circle
                cx={width - 9}
                cy={12}
                r={8}
                fill="none"
                stroke="#000"
                strokeOpacity={0.25}
                strokeWidth={1.2}
              />
              <Circle cx={width - 9} cy={12} r={2.5} fill={colors.charcoal} />
            </Svg>
            <Animated.View style={[styles.shaft, shaftStyle]} />
            <Animated.View style={[styles.head, headStyle]}>
              <Svg width={14} height={24}>
                <Path
                  d="M3 6 L12 12 L3 18"
                  fill="none"
                  stroke={colors.saffron}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </>
        ) : null}
      </View>
      <View style={styles.row}>
        <AppText variant="label">{left}</AppText>
        <AppText variant="label" style={styles.muted}>
          {right}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  track: {
    height: 24,
  },
  shaft: {
    position: 'absolute',
    left: 0,
    top: 11.25,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: colors.charcoal,
  },
  head: {
    position: 'absolute',
    left: -8,
    top: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muted: {
    color: colors.textMuted,
  },
});
