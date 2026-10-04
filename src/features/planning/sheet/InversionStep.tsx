import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { Chip, ChipRow } from '../../../components/Chip';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { TextField } from '../../../components/TextField';
import { motion, spacing } from '../../../theme';
import { SessionTag } from '../components/SessionTag';
import { DEFAULT_FAILURE_MODES, usePlanning } from '../store';
import { useSheetDraft } from './draft';

export function InversionStep() {
  const { draft, update, tag } = useSheetDraft();
  const custom = usePlanning(s => s.customFailureModes);
  const addFailureMode = usePlanning(s => s.addFailureMode);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');

  // Everything offered, plus anything chosen before that is no longer listed.
  const options = Array.from(
    new Set([...DEFAULT_FAILURE_MODES, ...custom, ...draft.failureModes]),
  );

  const toggle = (mode: string) =>
    update({
      failureModes: draft.failureModes.includes(mode)
        ? draft.failureModes.filter(m => m !== mode)
        : [...draft.failureModes, mode],
    });

  const addOwn = () => {
    const clean = text.trim();
    if (clean) {
      addFailureMode(clean);
      if (!draft.failureModes.includes(clean)) {
        update({ failureModes: [...draft.failureModes, clean] });
      }
    }
    setText('');
    setAdding(false);
  };

  return (
    <>
      <SessionTag text={tag} />
      <QuestionHeader
        eyebrow="Inversion"
        title="What guarantees failure?"
        subtitle="Name it now. You’ll see it coming."
      />
      <QuestionBody gap={26}>
        <ChipRow>
          {options.map(mode => (
            <Chip
              key={mode}
              testID={`failure-${mode}`}
              role="checkbox"
              label={mode}
              selected={draft.failureModes.includes(mode)}
              onPress={() => toggle(mode)}
            />
          ))}
          {!adding ? (
            <Chip
              testID="failure-add"
              label="+  Add your own"
              onPress={() => setAdding(true)}
            />
          ) : null}
        </ChipRow>
        {adding ? (
          <Animated.View
            entering={FadeIn.duration(motion.fast)}
            style={styles.own}
          >
            <TextField
              testID="failure-input"
              accessibilityLabel="Your own failure mode"
              value={text}
              onChangeText={setText}
              placeholder="Cousin’s wedding prep"
              autoFocus
              maxLength={40}
              onSubmitEditing={addOwn}
            />
          </Animated.View>
        ) : null}
        <View style={styles.note}>
          <AppText variant="caption">
            They show up again right before you start.
          </AppText>
        </View>
      </QuestionBody>
    </>
  );
}

const styles = StyleSheet.create({
  own: {
    marginTop: spacing.lg,
  },
  note: {
    marginTop: spacing.xl,
  },
});
