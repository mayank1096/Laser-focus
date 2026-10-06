import React from 'react';
import { StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, spacing, typography } from '../../theme';
import { useGoalSetup } from '../onboarding/store';

const STEPS = [
  'The action',
  'The shape of the work',
  'How many',
  'By when',
  'The steps',
];

export function PlanNextGoalScreen({
  navigation,
}: RootScreenProps<'PlanNextGoal'>) {
  const goal = useGoalSetup(
    s => s.goals.find(g => g.isPrimary)?.text ?? 'Your new goal',
  );
  return (
    <SimpleScreen
      testID="plan-next-goal"
      art={art.standing}
      hideBack
      onBack={() => {}}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Start planning"
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'GoalSetup' }] })
          }
        />
      }
    >
      <QuestionHeader
        eyebrow="New Magic Circle"
        title={goal}
        subtitle="Your values stay. Now set the action that gets you there. About 2 minutes."
      />
      <QuestionBody gap={22}>
        <View style={styles.card}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={[styles.row, i < STEPS.length - 1 && styles.divider]}
            >
              <AppText style={styles.n}>{i + 1}</AppText>
              <AppText variant="body">{s}</AppText>
            </View>
          ))}
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  n: {
    ...typography.button,
    fontFamily: fonts.sansMedium,
    color: colors.saffron,
  },
});
