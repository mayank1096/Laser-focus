import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import ChevronDown from '../assets/icons/chevron-down.svg';
import { colors, layout, radii, spacing } from '../theme';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';
import { useSurface } from './Surface';

export interface SelectFieldProps {
  value: string;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}

/** Looks like a field, opens a picker. Used for times and days. */
export function SelectField({
  value,
  onPress,
  accessibilityLabel,
  testID,
}: SelectFieldProps) {
  const surface = useSurface();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: value }}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.field,
        { backgroundColor: surface },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="body" style={styles.value}>
        {value}
      </AppText>
      <ChevronDown
        width={16}
        height={16}
        color={colors.textMuted}
        strokeWidth={1.75}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: layout.fieldHeight + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 14,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  value: {
    flex: 1,
  },
  pressed: {
    borderColor: colors.saffron,
  },
});
