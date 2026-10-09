import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { ListField } from '../../components/ListField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { appDay, weekStart } from '../../core/days';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { spacing } from '../../theme';
import {
  GoalsEditor,
  MilestonesEditor,
  TasksEditor,
  ValuesEditor,
} from '../components/SheetEditors';

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
  const week = weekStart(appDay(), state.rhythm.reviewDay);
  const sub =
    sheet === 'antiGoal'
      ? t.review.antiGoalSub
      : sheet === 'sacrifice'
      ? t.review.sacrificeSub
      : undefined;

  return (
    <SimpleScreen
      testID={`sheet-${sheet}`}
      tone="parchment"
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="sheet-done"
          label={t.common.done}
          onPress={() => navigation.goBack()}
        />
      }
    >
      <QuestionHeader
        eyebrow={t.book.title}
        title={t.book[sheet]}
        subtitle={sub}
      />
      <QuestionBody>
        {sheet === 'values' ? <ValuesEditor /> : null}
        {sheet === 'goals' ? <GoalsEditor /> : null}
        {sheet === 'milestones' ? <MilestonesEditor /> : null}
        {sheet === 'week' ? <TasksEditor week={week} /> : null}
        {sheet === 'antiGoal' ? (
          <ListField
            testID="antigoal-list"
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
              items={state.keep}
              onChange={state.setKeep}
              max={SACRIFICE_MAX}
              addLabel={t.book.add}
              idPrefix="keep"
            />
          </View>
        ) : null}
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  gap: {
    gap: spacing.md,
  },
  second: {
    marginTop: spacing.lg,
  },
});
