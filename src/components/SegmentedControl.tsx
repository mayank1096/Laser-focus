import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, springs, typography } from '../theme';
import { haptics } from '../utils/haptics';

export interface Segment<T extends string> {
  id: T;
  label: string;
}

/**
 * A row of choices with one thumb that slides to the chosen segment on a
 * morph spring, so the eye follows the change instead of seeing a jump.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  thumbColor = colors.night,
  testIDPrefix,
}: {
  segments: Segment<T>[];
  value: T | null;
  onChange: (id: T) => void;
  thumbColor?: string;
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
      x.value = withSpring(index * segWidth, springs.morph);
    }
    shown.value = withSpring(1, springs.snappy);
  }, [index, segWidth, x, shown]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: segWidth,
    opacity: shown.value,
    transform: [{ translateX: x.value }, { scale: 0.9 + shown.value * 0.1 }],
  }));

  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      onLayout={e => setWidth(e.nativeEvent.layout.width - 8)}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.thumb, { backgroundColor: thumbColor }, thumbStyle]}
      />
      {segments.map(s => {
        const on = s.id === value;
        return (
          <Pressable
            key={s.id}
            testID={testIDPrefix ? `${testIDPrefix}-${s.id}` : undefined}
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
              style={[
                typography.bodyMedium,
                { color: on ? colors.white : colors.textMuted },
              ]}
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
    padding: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radii.pill,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
  },
});
