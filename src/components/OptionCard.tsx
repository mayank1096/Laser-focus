import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Check from '../assets/icons/check.svg';
import { colors, layout, motion, radii, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';
import { useSurface } from './Surface';
import { sansDigits } from './Numerals';
import { OptionIcon, type IconComponent } from './OptionIcon';

export interface OptionCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** A small label at the top right, e.g. "Serious" or "Soon". */
  tag?: string;
  /** Shown but not choosable yet. */
  disabled?: boolean;
  /** An icon on the left that comes alive when the card is chosen. */
  icon?: IconComponent;
  testID?: string;
}

/**
 * A selectable card. The chosen card gets a saffron outline, a faint wash
 * and a check — never a solid fill, so it can't be mistaken for a button.
 * Unchosen cards with a description dim, so the choice reads at a glance.
 */
export function OptionCard({
  title,
  description,
  selected,
  onPress,
  tag,
  disabled = false,
  icon,
  testID,
}: OptionCardProps) {
  const surface = useSurface();
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
    borderColor: interpolateColor(
      active.value,
      [0, 1],
      [colors.border, colors.saffron],
    ),
    transform: [{ scale: scale.value }],
  }));
  const washStyle = useAnimatedStyle(() => ({ opacity: active.value }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: 0.6 + active.value * 0.4 }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: description ? 0.5 + active.value * 0.5 : 1,
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={disabled && styles.disabled}
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
        style={[styles.card, { backgroundColor: surface }, cardStyle]}
      >
        <Animated.View pointerEvents="none" style={[styles.wash, washStyle]} />
        {icon ? (
          <View style={styles.icon}>
            <OptionIcon Icon={icon} active={selected} />
          </View>
        ) : null}
        <Animated.View style={[styles.content, contentStyle]}>
          {description ? (
            <>
              <View style={styles.titleRow}>
                <Animated.Text style={[typography.cardTitle, styles.flex]}>
                  {sansDigits(title)}
                </Animated.Text>
                {tag ? (
                  <Animated.Text
                    style={[
                      typography.eyebrow,
                      selected ? styles.tagOn : styles.tagOff,
                    ]}
                  >
                    {tag}
                  </Animated.Text>
                ) : null}
              </View>
              <Animated.Text style={typography.micro}>
                {description}
              </Animated.Text>
            </>
          ) : (
            <Animated.Text
              style={selected ? typography.bodyBold : typography.body}
            >
              {title}
            </Animated.Text>
          )}
        </Animated.View>
        <Animated.View
          style={[styles.check, tag ? styles.hidden : null, checkStyle]}
        >
          <Check
            width={16}
            height={16}
            color={colors.saffron}
            strokeWidth={2.25}
          />
        </Animated.View>
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
    minHeight: layout.fieldHeight,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.field,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  wash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(250, 140, 34, 0.08)',
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  check: {
    marginLeft: spacing.md,
  },
  icon: {
    marginRight: spacing.md,
  },
  hidden: {
    display: 'none',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  tagOn: {
    color: colors.saffron,
  },
  tagOff: {
    color: colors.textFaint,
  },
  disabled: {
    opacity: 0.5,
  },
});
