import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ChevronRight from '../../assets/icons/chevron-right.svg';
import Lock from '../../assets/icons/lock.svg';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import { createId } from '../../utils/id';
import { haptics } from '../../utils/haptics';
import { LIMITS, useGoalSetup } from '../onboarding/store';
import { AddRow } from '../planning/setup/SessionTimesStep';
import { useGoalProgress } from '../progress';
import { SheetPage } from './components/SheetPage';

/**
 * One goal at a time. The Magic Circle goal is active; the rest are locked
 * until it is done or deliberately switched (never from Home).
 */
export function GoalsSheetScreen({
  navigation,
}: RootScreenProps<'GoalsSheet'>) {
  const goals = useGoalSetup(s => s.goals);
  const setGoals = useGoalSetup(s => s.setGoals);
  const progress = useGoalProgress();
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const primary = goals.find(g => g.isPrimary);
  const waiting = goals.filter(g => !g.isPrimary);

  return (
    <SheetPage
      testID="goals-sheet"
      eyebrow="Once every few years"
      title="Goals"
      subtitle="One goal at a time. The rest wait their turn."
      onBack={() => navigation.goBack()}
    >
      {primary ? (
        <Animated.View
          entering={FadeInDown.duration(motion.base)}
          style={styles.active}
        >
          <AppText variant="eyebrow" style={styles.saffron}>
            Magic circle
          </AppText>
          <AppText variant="heading" style={styles.goal}>
            {primary.text}
          </AppText>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(progress.done / progress.total) * 100}%` },
              ]}
            />
          </View>
          <AppText variant="micro" style={styles.muted}>
            {`${progress.done} of ${progress.total} ${progress.noun} · ${progress.monthsLeft} months left`}
          </AppText>
        </Animated.View>
      ) : null}

      {waiting.map((g, i) => (
        <Animated.View
          key={g.id}
          entering={FadeInDown.delay((i + 1) * motion.stagger).duration(
            motion.base,
          )}
          style={styles.locked}
        >
          <View style={styles.lockRow}>
            <Lock
              width={14}
              height={14}
              color={colors.textFaint}
              strokeWidth={1.75}
            />
            <AppText variant="eyebrow" style={styles.faint}>
              Locked
            </AppText>
          </View>
          <AppText variant="heading" style={[styles.goal, styles.faint]}>
            {g.text}
          </AppText>
          <AppText variant="micro" style={styles.faint}>
            {`Unlocks after ${primary?.text ?? 'the current goal'}`}
          </AppText>
        </Animated.View>
      ))}

      {goals.length < LIMITS.goals.max ? (
        <AddRow
          testID="goal-add"
          label="+  Add a goal"
          onPress={() => setAdding(true)}
        />
      ) : null}

      {waiting.length > 0 ? (
        <Pressable
          testID="switch-goal"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.switch}
          onPress={() => {
            haptics.tap();
            navigation.navigate('SwitchGoal');
          }}
        >
          <AppText variant="label" style={styles.muted}>
            Switch Magic Circle goal
          </AppText>
          <ChevronRight
            width={14}
            height={14}
            color={colors.textMuted}
            strokeWidth={1.75}
          />
        </Pressable>
      ) : null}

      <BottomSheet
        visible={adding}
        onClose={() => setAdding(false)}
        accessibilityLabel="New goal"
      >
        <AppText variant="heading" style={styles.sheetTitle}>
          A goal for later
        </AppText>
        <AppText variant="caption" style={styles.sheetNote}>
          It waits in line until your Magic Circle goal is done.
        </AppText>
        <TextField
          testID="goal-input"
          accessibilityLabel="Goal"
          value={text}
          onChangeText={setText}
          placeholder="Retire my parents by 2030"
          autoFocus
        />
        <PrimaryButton
          testID="goal-save"
          label="Add goal"
          shadow="none"
          disabled={text.trim().length < 3}
          style={styles.sheetButton}
          onPress={() => {
            setGoals([
              ...goals,
              { id: createId('goal'), text: text.trim(), isPrimary: false },
            ]);
            haptics.success();
            setText('');
            setAdding(false);
          }}
        />
      </BottomSheet>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  active: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.white,
    boxShadow: '0px 10px 24px rgba(0, 0, 0, 0.06)',
  },
  goal: {
    fontSize: 17,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.saffronLine,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: colors.saffron,
  },
  saffron: {
    color: colors.saffron,
  },
  muted: {
    color: colors.textMuted,
  },
  faint: {
    color: colors.textFaint,
  },
  locked: {
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.stone,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  switch: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sheetTitle: {
    marginBottom: spacing.xs,
  },
  sheetNote: {
    marginBottom: spacing.xl,
  },
  sheetButton: {
    marginTop: spacing.xxl,
  },
});
