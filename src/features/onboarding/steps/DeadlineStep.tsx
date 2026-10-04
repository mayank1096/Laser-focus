import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { RulerPicker } from '../../../components/RulerPicker';
import { colors, motion, spacing } from '../../../theme';
import { paceFor } from '../../../utils/pace';
import { countableNoun } from '../../../utils/text';
import { formatDuration } from '../../../utils/time';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { LIMITS, useGoalSetup } from '../store';

export function DeadlineStep() {
  const deadlineMonths = useGoalSetup(s => s.deadlineMonths);
  const setDeadlineMonths = useGoalSetup(s => s.setDeadlineMonths);
  const workShape = useGoalSetup(s => s.workShape);
  const targetCount = useGoalSetup(s => s.targetCount);
  const action = useGoalSetup(s => s.action);

  const pace =
    workShape === 'repeated'
      ? paceFor(targetCount, deadlineMonths, countableNoun(action))
      : null;

  return (
    <>
      <QuestionHeader
        minHeight={spacing.pickerHeader}
        eyebrow="By when"
        title="By when do you want to achieve this goal?"
        subtitle="Should be realistic"
      />
      <QuestionBody>
        <View style={styles.ruler}>
          <RulerPicker
            testID="deadline-ruler"
            accessibilityLabel="Time to achieve this goal"
            value={deadlineMonths}
            min={LIMITS.deadlineMonths.min}
            max={LIMITS.deadlineMonths.max}
            onChange={setDeadlineMonths}
            formatLabel={formatDuration}
          />
        </View>
        {pace ? (
          <Animated.View
            entering={FadeIn.duration(motion.base)}
            style={styles.pace}
            accessibilityLiveRegion="polite"
          >
            <AppText variant="caption" style={styles.center} testID="pace">
              {pace.label}
            </AppText>
            {pace.warning ? (
              <AppText variant="caption" style={[styles.center, styles.warn]}>
                {pace.warning}
              </AppText>
            ) : null}
          </Animated.View>
        ) : null}
      </QuestionBody>
    </>
  );
}

const styles = StyleSheet.create({
  ruler: {
    paddingHorizontal: 13,
  },
  pace: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  warn: {
    color: colors.ember,
  },
});
