import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { ListField } from '../../../components/ListField';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { RulerPicker } from '../../../components/RulerPicker';
import { spacing } from '../../../theme';
import { formatMinutes } from '../../../utils/date';
import { SessionTag } from '../components/SessionTag';
import { PLANNING_LIMITS } from '../store';
import { useSheetDraft } from './draft';

const { min, max, step } = PLANNING_LIMITS.sheetMinutes;

export function HowStep() {
  const { draft, update, tag } = useSheetDraft();
  return (
    <>
      <SessionTag text={tag} />
      <QuestionHeader eyebrow="How" title="How will you do it?" />
      <QuestionBody gap={24}>
        <ListField
          testID="sheet-steps"
          items={draft.steps}
          onChange={steps => update({ steps })}
          max={PLANNING_LIMITS.steps.max}
          min={1}
          addLabel="Add a step"
          placeholder="Phone in the other room"
          idPrefix="step"
        />
        <View style={styles.length}>
          <AppText variant="eyebrow" style={styles.label}>
            How long
          </AppText>
          <RulerPicker
            testID="sheet-minutes"
            accessibilityLabel="Session length"
            value={draft.minutes / step}
            min={min / step}
            max={max / step}
            onChange={v => update({ minutes: v * step })}
            formatLabel={v => formatMinutes(v * step)}
          />
        </View>
      </QuestionBody>
    </>
  );
}

const styles = StyleSheet.create({
  length: {
    marginTop: 30,
    paddingHorizontal: 13,
  },
  label: {
    alignSelf: 'flex-start',
    marginHorizontal: -13,
    marginBottom: spacing.lg,
  },
});
