import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion } from '../theme';

export interface ProgressSegmentsProps {
  total: number;
  /** Number of filled segments. Fractional values fill part of a segment. */
  filled: number;
  /** Called with a segment index when a filled segment is tapped. */
  onSegmentPress?: (index: number) => void;
}

/**
 * The segmented bar at the top of the goal-setup flow. Filling animates
 * from the left edge of each segment, one after another.
 */
export function ProgressSegments({
  total,
  filled,
  onSegmentPress,
}: ProgressSegmentsProps) {
  const progress = useSharedValue(filled);

  useEffect(() => {
    progress.value = withTiming(filled, {
      duration: motion.slow,
      easing: motion.easeOut,
    });
  }, [filled, progress]);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: filled }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Pressable
          key={i}
          style={styles.hit}
          hitSlop={{ top: 14, bottom: 14 }}
          disabled={!onSegmentPress || i >= Math.floor(filled) - 1}
          onPress={() => onSegmentPress?.(i)}
          accessibilityLabel={`Go back to step ${i + 1}`}
        >
          <Segment index={i} progress={progress} />
        </Pressable>
      ))}
    </View>
  );
}

function Segment({
  index,
  progress,
}: {
  index: number;
  progress: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.min(1, Math.max(0, progress.value - index)) }],
  }));

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
  },
  hit: {
    flex: 1,
  },
  track: {
    height: 3,
    borderRadius: 99,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.saffron,
    transformOrigin: 'left',
  },
});
