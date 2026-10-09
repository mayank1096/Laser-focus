import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, fonts, springs } from '../theme';
import { haptics } from '../utils/haptics';

export interface Segment<T extends string | number> {
  id: T;
  label: string;
  testID?: string;
}

/** The soft grey every control in the app sits on. */
export const TRACK = 'rgba(0, 0, 0, 0.045)';

/**
 * One choice from a few, on a soft track. A white thumb slides to the
 * chosen segment, so it reads as "chosen", never as a button.
 */
export function SegmentedControl<T extends string | number>({
  segments,
  value,
  onChange,
  testIDPrefix,
}: {
  segments: Segment<T>[];
  value: T | null;
  onChange: (id: T) => void;
  testIDPrefix?: string;
}) {
  const [width, setWidth] = useState(0);
  const index = segments.findIndex(s => s.id === value);
  const segWidth = width / segments.length;
  const x = useSharedValue(0);
  const shown = useSharedValue(0);

  useEffect(() => {
    if (index < 0 || !segWidth) {
      shown.value = withSpring(0, springs.snappy);
      return;
    }
    if (shown.value === 0) {
      // First choice appears in place; later choices slide.
      x.value = index * segWidth;
    } else {
      x.value = withSpring(index * segWidth, springs.snappy);
    }
    shown.value = withSpring(1, springs.snappy);
  }, [index, segWidth, x, shown]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: segWidth,
    opacity: shown.value,
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      onLayout={e => setWidth(e.nativeEvent.layout.width - 8)}
    >
      <Animated.View pointerEvents="none" style={[styles.thumb, thumbStyle]} />
      {segments.map(s => {
        const on = s.id === value;
        return (
          <Pressable
            key={String(s.id)}
            testID={
              s.testID ?? (testIDPrefix ? `${testIDPrefix}-${s.id}` : undefined)
            }
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) {
                haptics.selection();
                onChange(s.id);
              }
            }}
            style={styles.item}
          >
            <Animated.Text
              numberOfLines={1}
              style={[styles.label, !on && styles.off]}
            >
              {s.label}
            </Animated.Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 56,
    padding: 4,
    borderRadius: 28,
    backgroundColor: TRACK,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 24,
    backgroundColor: colors.white,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  off: {
    color: colors.textMuted,
  },
});
