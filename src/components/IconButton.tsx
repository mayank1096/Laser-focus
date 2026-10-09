import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { colors, radii } from '../theme';
import { haptics } from '../utils/haptics';

export interface IconButtonProps {
  Icon: React.FC<SvgProps>;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  /** Square background; omit for a bare icon. */
  filled?: boolean;
  disabled?: boolean;
  /** Icon colour; ink by default, white on dark or saffron grounds. */
  color?: string;
  testID?: string;
}

export function IconButton({
  Icon,
  onPress,
  accessibilityLabel,
  size = 18,
  filled = false,
  disabled = false,
  color = colors.ink,
  testID,
}: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        filled && styles.filled,
        (pressed || disabled) && styles.dim,
      ]}
    >
      <Icon width={size} height={size} color={color} strokeWidth={1.75} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.field,
  },
  filled: {
    backgroundColor: colors.chip,
  },
  dim: {
    opacity: 0.35,
  },
});
