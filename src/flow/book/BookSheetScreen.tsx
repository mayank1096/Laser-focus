import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { Goal } from '../../core/model';
import { haptics } from '../../utils/haptics';
import { SheetTitle } from '../components/SheetTitle';
import { AppText } from '../../components/AppText';
import { ListField } from '../../components/ListField';
import { appDay, weekStart } from '../../core/days';
import { circledGoal, useBook } from '../../core/store';
import { PRATIGYAS, useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import { shortDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { addDays } from '../../utils/date';
import {
  EditorAppearance,
  GoalsEditor,
  MilestonesEditor,
  TasksEditor,
  ValuesEditor,
} from '../components/SheetEditors';
import { SheetPage } from '../components/SheetPage';
import { vowText } from '../vow/TakeVowScreen';

const ANTI_GOAL_MAX = 4;
const SACRIFICE_MAX = 5;

/** One sheet of the book, open to edit. Everything saves as you type. */
export function BookSheetScreen({
  navigation,
  route,
}: RootScreenProps<'BookSheet'>) {
  const t = useT();
  const { sheet } = route.params;
  const state = useBook();
  const pratigya = useProfile(s => s.pratigya);
  const goal = circledGoal(state);
  const week = weekStart(appDay(), state.rhythm.reviewDay);
  const [switchTo, setSwitchTo] = useState<Goal | null>(null);
  const [endSure, setEndSure] = useState(false);

  const head: Record<typeof sheet, { eyebrow: string; sub: string }> = {
    values: { eyebrow: t.bookTab.valuesMeta, sub: t.bookSheet.valuesSub },
    goals: { eyebrow: t.bookTab.goalsMeta, sub: t.bookSheet.goalsSub },
    milestones: {
      eyebrow: t.bookTab.milestonesMeta(
        state.milestones.filter(
          m => m.goalId === state.circledGoalId && !m.archived && m.done,
        ).length,
        state.milestones.filter(
          m => m.goalId === state.circledGoalId && !m.archived,
        ).length,
      ),
      sub: goal?.text ?? '',
    },
    week: {
      eyebrow: t.bookTab.tasksMeta(
        `${shortDate(t, week)} – ${shortDate(t, addDays(week, 6))}`,
        state.tasks.filter(x => x.week === week).length,
      ),
      sub: goal?.text ?? '',
    },
    antiGoal: { eyebrow: t.bookTab.antiGoalMeta, sub: t.review.antiGoalSub },
    sacrifice: {
      eyebrow: t.bookTab.sacrificeMeta,
      sub: t.review.sacrificeSub,
    },
    vow: {
      eyebrow: pratigya ? `${PRATIGYAS[pratigya].name} प्रतिज्ञा` : '',
      sub: t.bookSheet.vowSub,
    },
  };

  return (
    <SheetPage
      testID={`sheet-${sheet}`}
      eyebrow={head[sheet].eyebrow}
      title={sheet === 'week' ? t.bookTab.tasks : t.book[sheet]}
      subtitle={head[sheet].sub}
      onBack={() => navigation.goBack()}
    >
      <EditorAppearance.Provider value="card">
        {sheet === 'values' ? <ValuesEditor /> : null}
        {sheet === 'goals' ? (
          <>
            <GoalsEditor />
            {state.goals.filter(g => g.id !== state.circledGoalId && !g.doneAt)
              .length ? (
              <View style={styles.switch}>
                <AppText variant="eyebrow">{t.book.switchGoal}</AppText>
                {state.goals
                  .filter(g => g.id !== state.circledGoalId && !g.doneAt)
                  .map(g => (
                    <Pressable
                      key={g.id}
                      testID={`switch-${g.id}`}
                      accessibilityRole="button"
                      onPress={() => setSwitchTo(g)}
                      style={styles.switchRow}
                    >
                      <AppText variant="body" style={styles.flex}>
                        {g.text}
                      </AppText>
                      <AppText variant="label" style={styles.link}>
                        {t.book.switchGoal}
                      </AppText>
                    </Pressable>
                  ))}
              </View>
            ) : null}
          </>
        ) : null}
        {sheet === 'milestones' ? (
          <>
            <MilestonesEditor />
            <Pressable
              testID="end-sprint"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setEndSure(true)}
              style={styles.end}
            >
              <AppText variant="label" style={styles.link}>
                {t.book.endSprint}
              </AppText>
            </Pressable>
          </>
        ) : null}
        {sheet === 'week' ? <TasksEditor week={week} /> : null}
        {sheet === 'antiGoal' ? (
          <ListField
            testID="antigoal-list"
            appearance="card"
            items={state.antiGoals}
            onChange={state.setAntiGoals}
            max={ANTI_GOAL_MAX}
            addLabel={t.book.add}
            idPrefix="anti"
          />
        ) : null}
        {sheet === 'sacrifice' ? (
          <View style={styles.gap}>
            <AppText variant="eyebrow">{t.book.giveUp}</AppText>
            <ListField
              testID="giveup-list"
              appearance="card"
              items={state.giveUp}
              onChange={state.setGiveUp}
              max={SACRIFICE_MAX}
              addLabel={t.book.add}
              idPrefix="give"
            />
            <AppText variant="eyebrow" style={styles.second}>
              {t.book.keep}
            </AppText>
            <ListField
              testID="keep-list"
              appearance="card"
              items={state.keep}
              onChange={state.setKeep}
              max={SACRIFICE_MAX}
              addLabel={t.book.add}
              idPrefix="keep"
            />
          </View>
        ) : null}
        {sheet === 'vow' && pratigya && goal ? (
          <View style={styles.vow}>
            <AppText style={styles.vowText}>
              {vowText(t, pratigya, goal.text)}
            </AppText>
          </View>
        ) : null}
      </EditorAppearance.Provider>

      <BottomSheet
        visible={switchTo !== null}
        onClose={() => setSwitchTo(null)}
        accessibilityLabel={t.book.switchGoal}
      >
        <SheetTitle title={switchTo?.text ?? ''} subtitle={t.book.switchSure} />
        <PrimaryButton
          testID="switch-confirm"
          label={t.book.switchGoal}
          shadow="none"
          onPress={() => {
            if (switchTo) {
              useBook.getState().switchGoal(switchTo.id);
              haptics.success();
              setSwitchTo(null);
              navigation.replace('BookSheet', { sheet: 'milestones' });
            }
          }}
        />
      </BottomSheet>

      <BottomSheet
        visible={endSure}
        onClose={() => setEndSure(false)}
        accessibilityLabel={t.book.endSprint}
      >
        <SheetTitle
          title={t.book.endSprint}
          subtitle={t.goalDone.endSprintSure}
        />
        <PrimaryButton
          testID="end-confirm"
          label={t.book.endSprint}
          shadow="none"
          onPress={() => {
            setEndSure(false);
            navigation.navigate('GoalDone');
          }}
        />
      </BottomSheet>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  switch: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  link: {
    color: colors.saffron,
  },
  end: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  gap: {
    gap: spacing.md,
  },
  second: {
    marginTop: spacing.lg,
  },
  vow: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  vowText: {
    ...typography.heading,
    lineHeight: 28,
  },
});
