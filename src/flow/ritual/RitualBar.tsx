import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { useT } from '../../i18n';

/** Six thin segments: where you are in the ritual. */
export function RitualBar({
  step,
  dark = false,
}: {
  step: number;
  dark?: boolean;
}) {
  const steps = useT().ritual.steps;
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: steps.length, now: step }}
    >
      {steps.map((s, i) => (
        <View
          key={s}
          style={[
            styles.seg,
            {
              backgroundColor:
                i < step
                  ? colors.saffron
                  : dark
                  ? 'rgba(255,255,255,0.18)'
                  : colors.track,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 5,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
});
