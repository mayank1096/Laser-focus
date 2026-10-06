import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { ListField } from '../../../components/ListField';
import { colors, motion, radii, spacing } from '../../../theme';
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
          inlineTrailing
          renderLeading={(index, adding) => (
            <StepNode
              index={index}
              adding={adding}
              last={
                adding ||
                (index === milestones.length - 1 &&
                  milestones.length >= LIMITS.milestones.max)
              }
            />
          )}
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

/**
 * The thread down the left: a numbered node per step, joined by a dashed
 * line, ending in an open node beside the add row.
 */
function StepNode({
  index,
  adding,
  last,
}: {
  index: number;
  adding: boolean;
  last: boolean;
}) {
  return (
    <View style={styles.node} pointerEvents="none">
      <View
        style={[
          styles.thread,
          index === 0 && styles.threadFirst,
          last && styles.threadLast,
          index === 0 && last && styles.hidden,
        ]}
      />
      <View style={[styles.dot, adding && styles.dotOpen]}>
        {adding ? null : (
          <AppText variant="micro" style={styles.number}>
            {index + 1}
          </AppText>
        )}
      </View>
    </View>
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
        <AppText variant="label">{label}</AppText>
        <AppText variant="label" style={styles.year}>
          {month ? month.slice(0, 4) : ''}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const NODE = 24;

const styles = StyleSheet.create({
  node: {
    width: NODE,
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: {
    position: 'absolute',
    top: -spacing.md,
    bottom: 0,
    left: NODE / 2 - 0.5,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderLeftColor: colors.saffron,
    opacity: 0.5,
  },
  threadFirst: {
    top: '50%',
  },
  threadLast: {
    bottom: '50%',
  },
  hidden: {
    opacity: 0,
  },
  dot: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: colors.saffron,
  },
  dotOpen: {
    width: 12,
    height: 12,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  number: {
    color: colors.saffron,
    lineHeight: 14,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  year: {
    color: colors.textMuted,
  },
  chip: {
    paddingHorizontal: 12,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
  },
});
