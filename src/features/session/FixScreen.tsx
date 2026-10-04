import React from 'react';
import { StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { formatMinutes } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { usePlanning } from '../planning/store';
import { PROBLEMS } from './fixes';
import { HALF_MARK_MINUTES, isComplete, useSessions } from './store';

export function FixScreen({ navigation, route }: RootScreenProps<'Fix'>) {
  const { date, slotId, reason } = route.params;
  const addFailureMode = usePlanning(s => s.addFailureMode);
  const result = useSessions(s => s.results[date]?.[slotId]);
  const fix = PROBLEMS.find(p => p.id === reason) ?? PROBLEMS[0];
  const mark = !result
    ? '—'
    : isComplete(result)
    ? 'Full — you stayed the whole time'
    : result.minutes >= HALF_MARK_MINUTES
    ? `Half — you sat ${formatMinutes(result.minutes)}`
    : 'None this time';

  return (
    <SimpleScreen
      testID="fix"
      art={art.bowShoulders}
      progress={{ total: 2, filled: 2 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Add to tomorrow"
          onPress={() => {
            // Tomorrow's inversion question will offer it straight away.
            addFailureMode(fix.failureMode);
            haptics.success();
            navigation.replace('StreakMark', { date });
          }}
        />
      }
    >
      <QuestionHeader
        eyebrow={fix.module}
        title={fix.title}
        subtitle={fix.body}
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          {fix.rows.map(([a, b]) => (
            <View key={a} style={styles.row}>
              <AppText variant="body">{a}</AppText>
              <AppText variant="micro" style={styles.muted}>
                {b}
              </AppText>
            </View>
          ))}
          <View style={[styles.row, styles.mark]}>
            <AppText variant="body">Today’s mark</AppText>
            <AppText variant="micro" style={styles.saffron}>
              {mark}
            </AppText>
          </View>
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  mark: {
    borderColor: colors.saffron,
  },
  muted: {
    color: colors.textMuted,
  },
  saffron: {
    color: colors.saffron,
  },
});
