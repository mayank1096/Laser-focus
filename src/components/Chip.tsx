import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion, radii, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** `radio` for one-of-many, `checkbox` for any-of-many, `button` otherwise. */
  role?: 'radio' | 'checkbox' | 'button';
  /** Fixed square size, for single letters like days of the week. */
  square?: number;
  accessibilityLabel?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * A small choice. Like an option card, a chosen chip is outlined in saffron
 * on a faint wash — never filled, so it never reads as a button.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  role = 'button',
  square,
  accessibilityLabel,
  style,
  testID,
}: ChipProps) {
  const active = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    active.value = withTiming(selected ? 1 : 0, { duration: motion.fast });
  }, [selected, active]);

  const chipStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      active.value,
      [0, 1],
      [colors.hairline, colors.saffron],
    ),
    backgroundColor: interpolateColor(
      active.value,
      [0, 1],
      [colors.white, colors.saffronWash],
    ),
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === 'button' ? undefined : { checked: selected }}
      hitSlop={4}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.95, motion.pressSpring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.pressSpring);
      }}
      style={style}
    >
      <Animated.View
        style={[
          styles.chip,
          square ? [styles.square, { width: square, height: square }] : null,
          chipStyle,
        ]}
      >
        <Animated.Text style={typography.label} numberOfLines={1}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

/** Chips that wrap onto as many lines as they need. */
export function ChipRow({
  children,
  wrap = true,
  spread = false,
}: {
  children: React.ReactNode;
  wrap?: boolean;
  /** Spread across the full width instead of packing to the left. */
  spread?: boolean;
}) {
  return (
    <View style={[styles.row, wrap && styles.wrap, spread && styles.spread]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  square: {
    paddingHorizontal: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  spread: {
    justifyContent: 'space-between',
  },
});
