import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { FlowFrame } from '../../../components/FlowFrame';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, radii, spacing } from '../../../theme';
import { formatClock, formatMinutes } from '../../../utils/date';
import { planFor, usePlanning } from '../store';

/**
 * The hand-off into a session: its sheet, read once more.
 *
 * TODO(devs): Part C replaces this with the session itself (ritual,
 * distraction checklist, phone away, timer — Figma 4.01–4.08).
 */
export function SessionStartScreen({
  navigation,
  route,
}: RootScreenProps<'SessionStart'>) {
  const { date, slotId } = route.params;
  const state = usePlanning();
  const session = planFor(state, date).sessions.find(v => v.slot.id === slotId);
  const sheet = session?.sheet;
  if (!session || !sheet) {
    return null;
  }

  return (
    <FlowFrame
      testID="session-start"
      stepKey="start"
      direction="forward"
      art={require('../../../assets/images/warrior-drawing-bow.jpg')}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="session-back"
          label="Back to today"
          onPress={() => navigation.navigate('Main', { tab: 'today' })}
        />
      }
    >
      <QuestionHeader
        eyebrow={`${formatClock(session.slot.start)} · ${formatMinutes(
          sheet.minutes,
        )}`}
        title={sheet.outcome}
        subtitle={sheet.challenge}
      />
      <QuestionBody gap={26}>
        <View style={styles.watch}>
          <AppText variant="eyebrow">Watch for</AppText>
          <View style={styles.tags}>
            {sheet.failureModes.map(mode => (
              <View key={mode} style={styles.tag}>
                <AppText variant="label">{mode}</AppText>
              </View>
            ))}
          </View>
        </View>
      </QuestionBody>
    </FlowFrame>
  );
}

const styles = StyleSheet.create({
  watch: {
    gap: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    backgroundColor: colors.blush,
  },
});
