import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme';
import type { DayMark } from '../store';

const FILL: Record<DayMark, string> = {
  full: colors.saffron,
  half: 'rgba(250, 140, 34, 0.45)',
  pending: colors.saffronWash,
  missed: 'rgba(0, 0, 0, 0.08)',
  empty: colors.saffronWash,
};

/**
 * One square a day: solid for a full mark, half-tone for a half mark.
 * The course's daily success calendar, in a glance.
 */
export function MarkGrid({
  marks,
  size = 14,
  gap = 4,
  onDark = false,
}: {
  marks: DayMark[];
  size?: number;
  gap?: number;
  onDark?: boolean;
}) {
  return (
    <View
      style={[styles.grid, { gap }]}
      accessible
      accessibilityLabel={`${
        marks.filter(m => m === 'full').length
      } full marks, ${marks.filter(m => m === 'half').length} half marks`}
    >
      {marks.map((m, i) => (
        <View
          key={i}
          style={[
            { width: size, height: size, borderRadius: size * 0.22 },
            onDark && (m === 'empty' || m === 'pending')
              ? styles.onDark
              : fills[m],
          ]}
        />
      ))}
    </View>
  );
}

const fills = StyleSheet.create({
  full: { backgroundColor: FILL.full },
  half: { backgroundColor: FILL.half },
  pending: { backgroundColor: FILL.pending },
  missed: { backgroundColor: FILL.missed },
  empty: { backgroundColor: FILL.empty },
});

const styles = StyleSheet.create({
  onDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
