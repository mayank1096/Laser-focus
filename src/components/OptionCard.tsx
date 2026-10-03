import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, layout, motion, radii, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

export interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /**
   * - `fill`: selected card turns solid saffron (Magic Circle).
   * - `outline`: selected card gets a saffron border, others dim (work shape).
   */
  variant?: 'fill' | 'outline';
  testID?: string;
}

export function OptionCard({
  title,
  description,
  selected,
  onPress,
  variant = 'fill',
  testID,
}: OptionCardProps) {
  const active = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    active.value = withTiming(selected ? 1 : 0, { duration: motion.base });
    if (selected) {
      // A small "landing" bounce when a card becomes the choice.
      scale.value = withSpring(1.02, motion.pressSpring, () => {
        scale.value = withSpring(1, motion.spring);
      });
    }
  }, [selected, active, scale]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor:
      variant === 'fill'
        ? interpolateColor(
            active.value,
            [0, 1],
            ['rgba(250,140,34,0)', colors.saffron],
          )
        : 'transparent',
    borderColor: interpolateColor(
      active.value,
      [0, 1],
      [colors.border, colors.saffron],
    ),
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() =>
    variant === 'fill'
      ? {
          color: interpolateColor(
            active.value,
            [0, 1],
            [colors.ink, colors.white],
          ),
        }
      : { opacity: 0.5 + active.value * 0.5 },
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        if (!selected) {
          haptics.selection();
        }
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.98, motion.pressSpring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.pressSpring);
      }}
    >
      <Animated.View
        style={[
          styles.card,
          variant === 'outline' ? styles.outline : styles.fill,
          cardStyle,
        ]}
      >
        {variant === 'fill' ? (
          <Animated.Text
            style={[
              selected ? typography.bodyBold : typography.body,
              styles.centered,
              textStyle,
            ]}
          >
            {title}
          </Animated.Text>
        ) : (
          <Animated.View style={[styles.stack, textStyle]}>
            <Animated.Text style={typography.cardTitle}>{title}</Animated.Text>
            {description ? (
              <Animated.Text style={typography.micro}>
                {description}
              </Animated.Text>
            ) : null}
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function OptionList({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.list} accessibilityRole="radiogroup">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: radii.field,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  fill: {
    minHeight: layout.fieldHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    justifyContent: 'center',
  },
  stack: {
    gap: spacing.sm,
  },
  centered: {
    textAlign: 'center',
  },
});
