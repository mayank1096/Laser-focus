import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ListField } from '../../../components/ListField';
import { colors, motion, radii, typography } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { countableNoun } from '../../../utils/text';
import { shortMonthLabel } from '../../../utils/time';
import { QuestionBody, QuestionHeader } from '../components/QuestionHeader';
import { LIMITS, suggestBatchMilestones, useGoalSetup } from '../store';

export function MilestonesStep() {
  const milestones = useGoalSetup(s => s.milestones);
  const setMilestones = useGoalSetup(s => s.setMilestones);
  const workShape = useGoalSetup(s => s.workShape);
  const action = useGoalSetup(s => s.action);
  const targetCount = useGoalSetup(s => s.targetCount);
  const cycleMonth = useGoalSetup(s => s.cycleMilestoneMonth);

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
              onPress={() => cycleMonth(item.id)}
            />
          )}
        />
      </QuestionBody>
    </>
  );
}

/** Shows the milestone's month; tapping moves it on by one month. */
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
      accessibilityLabel={`Due ${label}. Tap to change the month.`}
      hitSlop={4}
    >
      <Animated.Text
        key={label}
        entering={FadeIn.duration(motion.base)}
        exiting={FadeOut.duration(motion.fast)}
        style={typography.body}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.field,
    backgroundColor: colors.chip,
  },
});
