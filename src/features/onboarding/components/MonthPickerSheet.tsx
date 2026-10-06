import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { BottomSheet } from '../../../components/BottomSheet';
import { colors, radii, spacing, springs, typography } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { addMonths } from '../../../utils/time';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const CLOSE_AFTER = 260;

/**
 * Pick a milestone's month from a calendar of the whole run, year by year.
 * Months outside the run are shown but can't be chosen; other milestones'
 * months carry a small dot so the order stays visible.
 */
export function MonthPickerSheet({
  visible,
  onClose,
  title,
  value,
  runMonths,
  taken,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  /** The milestone being dated. */
  title: string;
  value?: string;
  /** How many months the goal runs for, from next month. */
  runMonths: number;
  /** Months already used by the other milestones. */
  taken: string[];
  onPick: (month: string) => void;
}) {
  const range = useMemo(() => {
    const now = new Date();
    return {
      first: addMonths(now, 1),
      last: addMonths(now, Math.max(1, runMonths)),
    };
  }, [runMonths]);
  const years = useMemo(() => {
    const a = Number(range.first.slice(0, 4));
    const b = Number(range.last.slice(0, 4));
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }, [range]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel="Choose a month"
      testID="month-picker"
    >
      <AppText variant="eyebrow">Done by</AppText>
      <AppText variant="heading" style={styles.title} numberOfLines={2}>
        {title}
      </AppText>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.years}
        showsVerticalScrollIndicator={false}
      >
        {years.map(year => (
          <View key={year} style={styles.year}>
            <AppText variant="label" style={styles.yearLabel}>
              {year}
            </AppText>
            <View style={styles.grid}>
              {MONTHS.map((name, i) => {
                const iso = `${year}-${String(i + 1).padStart(2, '0')}`;
                const inRange = iso >= range.first && iso <= range.last;
                return (
                  <MonthCell
                    key={iso}
                    label={name}
                    selected={iso === value}
                    taken={taken.includes(iso)}
                    disabled={!inRange}
                    deadline={iso === range.last}
                    onPress={() => {
                      haptics.selection();
                      onPick(iso);
                      setTimeout(onClose, CLOSE_AFTER);
                    }}
                    testID={`month-${iso}`}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

function MonthCell({
  label,
  selected,
  taken,
  disabled,
  deadline,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  taken: boolean;
  disabled: boolean;
  deadline: boolean;
  onPress: () => void;
  testID: string;
}) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (selected) {
      pop.value = withSequence(
        withSpring(1.08, springs.snappy),
        withSpring(1, springs.snappy),
      );
    }
  }, [selected, pop]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.cellSlot}
    >
      <Animated.View
        style={[
          styles.cell,
          selected && styles.cellOn,
          deadline && !selected && styles.cellDeadline,
          style,
        ]}
      >
        <AppText
          variant="bodyMedium"
          style={[
            selected ? styles.textOn : null,
            disabled ? styles.textOff : null,
          ]}
        >
          {label}
        </AppText>
        <View style={[styles.dot, taken && !selected && styles.dotOn]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  scroll: {
    maxHeight: 420,
  },
  years: {
    gap: spacing.xl,
    paddingBottom: spacing.lg,
  },
  year: {
    gap: spacing.md,
  },
  yearLabel: {
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  cellSlot: {
    width: '25%',
    paddingHorizontal: 4,
  },
  cell: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.field,
    gap: 4,
  },
  cellOn: {
    backgroundColor: colors.saffron,
  },
  cellDeadline: {
    borderWidth: 1,
    borderColor: colors.saffronLine,
    borderStyle: 'dashed',
  },
  textOn: {
    ...typography.bodyBold,
    color: colors.white,
  },
  textOff: {
    color: colors.textGhost,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotOn: {
    backgroundColor: colors.saffron,
  },
});
