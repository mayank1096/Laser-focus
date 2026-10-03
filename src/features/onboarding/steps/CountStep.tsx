import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RulerPicker } from '../../../components/RulerPicker';
import { spacing } from '../../../theme';
import { countableNoun } from '../../../utils/text';
import { QuestionBody, QuestionHeader } from '../components/QuestionHeader';
import { LIMITS, useGoalSetup } from '../store';

export function CountStep() {
  const action = useGoalSetup(s => s.action);
  const targetCount = useGoalSetup(s => s.targetCount);
  const setTargetCount = useGoalSetup(s => s.setTargetCount);
  const noun = countableNoun(action);

  return (
    <>
      <QuestionHeader
        minHeight={spacing.pickerHeader}
        eyebrow="How many"
        title={`How many ${noun}?`}
        subtitle="Enough that you cannot fail."
      />
      <QuestionBody>
        <View style={styles.ruler}>
          <RulerPicker
            testID="count-ruler"
            accessibilityLabel={`Number of ${noun}`}
            value={targetCount}
            min={LIMITS.targetCount.min}
            max={LIMITS.targetCount.max}
            onChange={setTargetCount}
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
