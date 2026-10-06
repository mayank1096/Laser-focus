import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { HoldButton } from '../../components/HoldButton';
import { rise } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { useGoalSetup } from '../onboarding/store';
import { usePlanning } from '../planning/store';
import { useProfile, type Pratigya } from '../account/store';
import { VOW_STEPS } from './PathScreen';
import { sansDigits } from '../../components/Numerals';

const DATE = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** "Clear CA Foundation by June 2027" → "clear CA Foundation by June 2027". */
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function vowText(pratigya: Pratigya, goal: string): string {
  switch (pratigya) {
    case 'abhimanyu':
      return 'Before every session, I silence every distraction. If I forget, I stop and set it right before I sit.';
    case 'bhishma':
      return `Until I ${lower(
        goal,
      )}, my phone is for calls alone. This vow is never taken back.`;
    default:
      return `Until I ${lower(
        goal,
      )}, no distraction returns to my phone. If one does, I stop and set it right before I sit again.`;
  }
}

export function TakeVowScreen({ navigation }: RootScreenProps<'TakeVow'>) {
  const { name, pratigya } = useProfile();
  const takeVow = useProfile(s => s.takeVow);
  const goal = useGoalSetup(
    s => s.goals.find(g => g.isPrimary)?.text ?? 'my goal',
  );

  return (
    <SimpleScreen
      testID="take-vow"
      art={art.kneeling}
      progress={{ total: VOW_STEPS, filled: 6 }}
      onBack={() => navigation.goBack()}
      footer={
        <HoldButton
          testID="vow-hold"
          label="Hold to take the vow"
          duration={2400}
          onComplete={() => {
            takeVow(now().toISOString());
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: usePlanning.getState().setupDone
                    ? 'DayOne'
                    : 'WeekSetup',
                },
              ],
            });
          }}
        />
      }
    >
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        The vow
      </Animated.Text>
      <Animated.Text entering={rise(1)} style={styles.devanagari}>
        मैं प्रतिज्ञा लेता हूँ।
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={styles.vow}>
        {sansDigits(vowText(pratigya ?? 'arjun', goal))}
      </Animated.Text>
      <Animated.View entering={rise(3)} style={styles.signature}>
        <AppText style={styles.name} numberOfLines={1}>
          {name.trim() || 'Your name'}
        </AppText>
        <AppText variant="micro" style={styles.muted}>
          {DATE.format(now())}
        </AppText>
      </Animated.View>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  devanagari: {
    ...typography.title,
    marginTop: spacing.xl,
  },
  vow: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 26,
    marginTop: spacing.xxl,
  },
  signature: {
    marginTop: 36,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.border,
  },
  name: {
    ...typography.title,
    fontSize: 24,
    color: colors.textMuted,
    flex: 1,
  },
  muted: {
    color: colors.textMuted,
  },
});
