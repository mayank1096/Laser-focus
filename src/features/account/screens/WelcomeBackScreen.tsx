import React from 'react';
import { StyleSheet, View } from 'react-native';
import { art } from '../../../assets/art';
import { AppText } from '../../../components/AppText';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { SimpleScreen } from '../../../components/SimpleScreen';
import type { RootScreenProps } from '../../../navigation/types';
import { resumeRoute } from '../../../navigation/resume';
import { colors, spacing } from '../../../theme';
import { useGoalProgress, useRecentMarks, useStreak } from '../../progress';
import { MarkGrid } from '../../session/components/MarkGrid';
import { firstName, PRATIGYAS, useProfile } from '../store';

/**
 * TODO(devs): after sign-in, download the account's sheets and history,
 * then show this. Today it shows what is on the device.
 */
export function WelcomeBackScreen({
  navigation,
}: RootScreenProps<'WelcomeBack'>) {
  const { name, pratigya } = useProfile();
  const progress = useGoalProgress();
  const streak = useStreak();
  const marks = useRecentMarks(36).map(m => m.mark);

  return (
    <SimpleScreen
      testID="welcome-back"
      art={art.drawingBow}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Continue"
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: resumeRoute() }] })
          }
        />
      }
    >
      <QuestionHeader
        eyebrow="Welcome back"
        title={
          name
            ? `Good to see you again, ${firstName(name)}.`
            : 'Good to see you again.'
        }
        subtitle="Everything is restored from your account."
      />
      <QuestionBody gap={28}>
        <View style={styles.card}>
          <AppText variant="eyebrow" style={styles.saffron}>
            Magic circle
          </AppText>
          <AppText variant="heading" style={styles.goal}>
            {progress.goal}
          </AppText>
          <View style={styles.stats}>
            <Stat value={`Day ${streak}`} label="streak kept" />
            <Stat
              value={`${progress.done} / ${progress.total}`}
              label={progress.noun}
            />
            <Stat
              value={pratigya ? PRATIGYAS[pratigya].latin : '—'}
              label="pratigya"
              end
            />
          </View>
          <MarkGrid marks={marks} size={16} gap={3.5} />
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

function Stat({
  value,
  label,
  end,
}: {
  value: string;
  label: string;
  end?: boolean;
}) {
  return (
    <View style={end ? styles.end : null}>
      <AppText variant="bodyBold">{value}</AppText>
      <AppText variant="micro" style={styles.muted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
    boxShadow: '0px 10px 24px rgba(0, 0, 0, 0.06)',
  },
  saffron: {
    color: colors.saffron,
  },
  goal: {
    fontSize: 17,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  end: {
    alignItems: 'flex-end',
  },
  muted: {
    color: colors.textMuted,
  },
});
