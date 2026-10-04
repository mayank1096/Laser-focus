import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { TextField } from '../../../components/TextField';
import { spacing } from '../../../theme';
import { SessionTag } from '../components/SessionTag';
import { useSheetDraft } from './draft';

export function OutcomeStep() {
  const { draft, update, last, tag } = useSheetDraft();
  return (
    <>
      <SessionTag text={tag} />
      <QuestionHeader
        eyebrow="Outcome"
        title="What will be finished?"
        subtitle="When this session ends. One thing you can check off."
      />
      <QuestionBody gap={28}>
        <View style={styles.body}>
          <TextField
            testID="sheet-outcome"
            accessibilityLabel="Outcome"
            value={draft.outcome}
            onChangeText={outcome => update({ outcome })}
            placeholder="Paper 2 attempted in full, under exam time"
            multiline
          />
          {last ? (
            <AppText variant="caption">{`Last time: “${last.outcome}”`}</AppText>
          ) : (
            <AppText variant="caption">
              Not “study accounts”. “Chapter 4 questions, all 30.”
            </AppText>
          )}
        </View>
      </QuestionBody>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.lg,
  },
});
