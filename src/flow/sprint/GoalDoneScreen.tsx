import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { appDay } from '../../core/days';
import { activeMilestones } from '../../core/home';
import { circledGoal, useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';
import { Calendar, countDays } from '../components/Calendar';
import { CheckRow } from './ReviewScreen';

/** The goal, every milestone ticked, and every box since the circle. */
export function GoalDoneScreen({ navigation }: RootScreenProps<'GoalDone'>) {
  const t = useT();
  const state = useBook();
  const goal = circledGoal(state);
  const today = appDay();
  const from = state.sprintStart ?? today;
  const { full, half } = countDays(state, from, today);

  return (
    <SimpleScreen
      testID="goal-done"
      tone="parchment"
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="rest-now"
          label={t.goalDone.rest}
          onPress={() => {
            haptics.success();
            useBook.getState().finishGoal();
            navigation.replace('Rest');
          }}
        />
      }
    >
      <Animated.Text entering={rise(0)} style={typography.display}>
        {t.goalDone.title}
      </Animated.Text>
      {goal ? (
        <Animated.View entering={rise(1)}>
          <AppText style={[typography.title, styles.goal]}>{goal.text}</AppText>
        </Animated.View>
      ) : null}
      <Animated.View entering={rise(2)} style={styles.card}>
        {activeMilestones(state).map(m => (
          <CheckRow
            key={m.id}
            label={m.text}
            checked={m.done}
            onPress={() => state.toggleMilestone(m.id)}
          />
        ))}
      </Animated.View>
      <Animated.View entering={rise(3)} style={styles.card}>
        <Calendar book={state} from={from} to={today} />
        <AppText variant="label" style={styles.muted}>
          {t.goalDone.counts(full, half)}
        </AppText>
      </Animated.View>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  goal: {
    marginTop: spacing.md,
  },
  card: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  muted: {
    color: colors.textMuted,
  },
});
