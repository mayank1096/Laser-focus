import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Minus from '../assets/icons/minus.svg';
import Plus from '../assets/icons/plus.svg';
import { colors, fonts, radii, typography } from '../theme';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';

export interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
  testID?: string;
}

/** − n + for small counts, like how many sessions a task needs. */
export function Stepper({
  value,
  min,
  max,
  onChange,
  accessibilityLabel,
  testID,
}: StepperProps) {
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) {
      haptics.warning();
      return;
    }
    haptics.selection();
    onChange(next);
  };

  return (
    <View
      style={styles.stepper}
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e =>
        step(e.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
    >
      <Pressable
        testID={testID ? `${testID}-minus` : undefined}
        accessibilityRole="button"
        accessibilityLabel="Fewer"
        style={styles.cell}
        hitSlop={4}
        onPress={() => step(-1)}
      >
        <Minus
          width={16}
          height={16}
          color={value <= min ? colors.textGhost : colors.textMuted}
          strokeWidth={2}
        />
      </Pressable>
      <AppText variant="button" style={styles.value}>
        {value}
      </AppText>
      <Pressable
        testID={testID ? `${testID}-plus` : undefined}
        accessibilityRole="button"
        accessibilityLabel="More"
        style={styles.cell}
        hitSlop={4}
        onPress={() => step(1)}
      >
        <Plus
          width={16}
          height={16}
          color={value >= max ? colors.textGhost : colors.saffron}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  cell: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.button,
    fontFamily: fonts.sansMedium,
    color: colors.ink,
    minWidth: 16,
    textAlign: 'center',
  },
});
