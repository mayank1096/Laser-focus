import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion, radii, typography } from '../theme';
import { haptics } from '../utils/haptics';
import { sansDigits } from './Numerals';

type ShadowTone = 'ember' | 'dark' | 'none';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  /**
   * A disabled button still reacts: it shakes and buzzes, so the user knows
   * the screen is waiting on them rather than broken.
   */
  disabled?: boolean;
  shadow?: ShadowTone;
  /** `light`: a cream button for night screens, where charcoal would vanish. */
  tone?: 'dark' | 'light';
  style?: ViewStyle;
  testID?: string;
}

const SHADOWS: Record<Exclude<ShadowTone, 'none'>, string> = {
  ember: `0px 10px 24px ${colors.buttonShadow}`,
  dark: '0px 13px 17px rgba(0, 0, 0, 0.4)',
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  shadow = 'ember',
  tone = 'dark',
  style,
  testID,
}: PrimaryButtonProps) {
  const fill = tone === 'light' ? colors.cream : colors.charcoal;
  const ink = tone === 'light' ? colors.ink : colors.white;
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const enabled = useSharedValue(disabled ? 0 : 1);

  useEffect(() => {
    enabled.value = withTiming(disabled ? 0 : 1, { duration: motion.base });
  }, [disabled, enabled]);

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      enabled.value,
      [0, 1],
      [colors.buttonDisabled, fill],
    ),
    transform: [{ translateX: shakeX.value }, { scale: scale.value }],
  }));

  // The shadow lives on its own layer so it can fade without fading the button.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: enabled.value,
    transform: [{ translateX: shakeX.value }, { scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      enabled.value,
      [0, 1],
      [colors.textOnDisabled, ink],
    ),
  }));

  const handlePress = () => {
    if (disabled) {
      haptics.warning();
      shakeX.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      return;
    }
    haptics.tap();
    onPress();
  };

  return (
    <View style={style}>
      {shadow !== 'none' && (
        <Animated.View
          pointerEvents="none"
          style={[styles.shadow, { boxShadow: SHADOWS[shadow] }, shadowStyle]}
        />
      )}
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.97, motion.pressSpring);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, motion.pressSpring);
        }}
      >
        <Animated.View style={[styles.button, buttonStyle]}>
          <Animated.Text style={[typography.button, labelStyle]}>
            {sansDigits(label)}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  outline: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  outlineLabel: {
    color: colors.ink,
  },
  outlineDark: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  outlineLabelDark: {
    color: colors.white,
  },
  shadow: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.button,
    backgroundColor: colors.charcoal,
  },
});

/** The quieter choice beside a primary button: outlined, no shadow. */
export function OutlineButton({
  label,
  onPress,
  style,
  testID,
  icon,
  onDark = false,
}: Omit<PrimaryButtonProps, 'disabled' | 'shadow' | 'tone'> & {
  /** Shown before the label, e.g. a Google or Apple mark. */
  icon?: React.ReactNode;
  /** On a night screen: a hairline outline on the dark ground. */
  onDark?: boolean;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      testID={testID}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97, motion.pressSpring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.pressSpring);
      }}
    >
      <Animated.View
        style={[
          styles.button,
          styles.outline,
          onDark && styles.outlineDark,
          pressStyle,
        ]}
      >
        {icon}
        <Animated.Text
          style={[
            typography.button,
            styles.outlineLabel,
            onDark && styles.outlineLabelDark,
          ]}
        >
          {sansDigits(label)}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}
