import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RulerPicker } from '../../../components/RulerPicker';
import { spacing } from '../../../theme';
import { formatDuration } from '../../../utils/time';
import { QuestionBody, QuestionHeader } from '../components/QuestionHeader';
import { LIMITS, useGoalSetup } from '../store';

export function DeadlineStep() {
  const deadlineMonths = useGoalSetup(s => s.deadlineMonths);
  const setDeadlineMonths = useGoalSetup(s => s.setDeadlineMonths);

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
      </QuestionBody>
    </>
  );
}

const styles = StyleSheet.create({
  ruler: {
    paddingHorizontal: 13,
  },
});
