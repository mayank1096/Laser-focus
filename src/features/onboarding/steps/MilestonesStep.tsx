import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { ListField } from '../../../components/ListField';
import { colors, motion, radii } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { countableNoun } from '../../../utils/text';
import { shortMonthLabel } from '../../../utils/time';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { LIMITS, suggestBatchMilestones, useGoalSetup } from '../store';
import { MonthPickerSheet } from '../components/MonthPickerSheet';

export function MilestonesStep() {
  const milestones = useGoalSetup(s => s.milestones);
  const setMilestones = useGoalSetup(s => s.setMilestones);
  const workShape = useGoalSetup(s => s.workShape);
  const action = useGoalSetup(s => s.action);
  const targetCount = useGoalSetup(s => s.targetCount);
  const setMonth = useGoalSetup(s => s.setMilestoneMonth);
  const deadlineMonths = useGoalSetup(s => s.deadlineMonths);
  const [picking, setPicking] = useState<string | null>(null);
  const picked = milestones.find(m => m.id === picking);

  // For repeated work, start with the count split into batches; the user can
  // edit or delete them like any other line.
  useEffect(() => {
    if (workShape === 'repeated' && milestones.length === 0) {
      setMilestones(suggestBatchMilestones(countableNoun(action), targetCount));
    }
    // Only when arriving at this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <QuestionHeader
        eyebrow="Steps"
        title="What are the steps?"
        subtitle="In order. Each one must finish something."
      />
      <QuestionBody>
        <ListField
          testID="milestones-list"
          items={milestones}
          onChange={setMilestones}
          max={LIMITS.milestones.max}
          min={LIMITS.milestones.min}
          addLabel="Add a new Milestone"
          placeholder="Finish the first 10 mock tests"
          idPrefix="milestone"
          renderTrailing={(item, index) => (
            <MonthChip
              month={milestones[index]?.dueMonth}
              onPress={() => setPicking(item.id)}
            />
          )}
        />
      </QuestionBody>
      <MonthPickerSheet
        visible={picked != null}
        onClose={() => setPicking(null)}
        title={picked?.text ?? ''}
        value={picked?.dueMonth}
        runMonths={deadlineMonths}
        taken={milestones
          .filter(m => m.id !== picking && m.dueMonth)
          .map(m => m.dueMonth as string)}
        onPick={month => picking && setMonth(picking, month)}
      />
    </>
  );
}

/** Shows the milestone's month; tapping opens the month picker. */
function MonthChip({
  month,
  onPress,
}: {
  month?: string;
  onPress: () => void;
}) {
  const label = month ? shortMonthLabel(month) : '';
  return (
    <Pressable
      style={styles.chip}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Due ${label}. Choose a month.`}
      hitSlop={4}
    >
      <Animated.View
        key={month}
        entering={FadeIn.duration(motion.base)}
        exiting={FadeOut.duration(motion.fast)}
        style={styles.chipInner}
      >
        <AppText variant="bodyMedium">{label}</AppText>
        <AppText variant="micro" style={styles.year}>
          {month ? month.slice(0, 4) : ''}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chipInner: {
    alignItems: 'center',
  },
  year: {
    color: colors.textMuted,
  },
  chip: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.field,
    backgroundColor: colors.chip,
  },
});
