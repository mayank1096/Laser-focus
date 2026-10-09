import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { FlowFrame, type FlowDirection } from '../../components/FlowFrame';
import { OptionCard, OptionList } from '../../components/OptionCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { appDay, weekStart } from '../../core/days';
import { activeMilestones } from '../../core/home';
import { LIMITS, type SetupStep } from '../../core/model';
import { circledGoal, useBook, type BookState } from '../../core/store';
import { useT, type Strings } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { createId } from '../../utils/id';
import { haptics } from '../../utils/haptics';
import { RhythmEditor } from '../components/RhythmEditor';
import {
  GoalsEditor,
  MilestonesEditor,
  TasksEditor,
  ValuesEditor,
} from '../components/SheetEditors';

type SheetStep = Extract<
  SetupStep,
  'values' | 'goals' | 'circle' | 'milestones' | 'tasks' | 'rhythm'
>;

const ALL: SheetStep[] = [
  'values',
  'goals',
  'circle',
  'milestones',
  'tasks',
  'rhythm',
];

const ART = {
  values: art.standing,
  goals: art.arrows,
  circle: art.drawingBow,
  milestones: art.bowShoulders,
  tasks: undefined,
  rhythm: undefined,
};

const thisWeek = (s: BookState) => weekStart(appDay(), s.rhythm.reviewDay);

/** The minimum each sheet needs before Next opens. */
function ready(step: SheetStep, s: BookState): boolean {
  switch (step) {
    case 'values':
      return s.values.filter(v => v.text.trim()).length >= LIMITS.values.min;
    case 'goals':
      return s.goals.length >= LIMITS.goals.min;
    case 'circle':
      return Boolean(s.circledGoalId);
    case 'milestones':
      return activeMilestones(s).length >= LIMITS.milestones.min;
    case 'tasks':
      return (
        s.tasks.filter(x => x.week === thisWeek(s) && x.kind === 'deep')
          .length >= LIMITS.deep.min
      );
    case 'rhythm':
      return true;
  }
}

/**
 * Setup, one sheet at a time, autosaving as you type. Also re-used for the
 * re-read after time away (values, goals) and for reassess (circle the next
 * goal, its milestones, this week's tasks).
 */
export function SetupScreen({ navigation, route }: RootScreenProps<'Setup'>) {
  const t = useT();
  const state = useBook();
  const mode = route.params?.returnTo;
  const steps: SheetStep[] =
    mode === 'reread'
      ? ['values', 'goals']
      : mode === 'reassess'
      ? ['circle', 'milestones', 'tasks']
      : ALL;
  const startAt = Math.max(
    0,
    steps.indexOf((route.params?.step ?? state.setup) as SheetStep),
  );
  const [index, setIndex] = useState(startAt);
  const [direction, setDirection] = useState<FlowDirection>('forward');
  const step = steps[index];

  // First visit: the course's twelve values, ready to edit.
  useEffect(() => {
    if (step === 'values' && !useBook.getState().values.length) {
      useBook
        .getState()
        .setValues(t.values.template.map(text => ({ id: createId('value'), text })));
    }
  }, [step, t]);

  // Remember the sheet, so Home brings an unfinished setup back here.
  useEffect(() => {
    if (!mode && useBook.getState().setup !== 'done') {
      useBook.getState().setSetup(step);
    }
  }, [step, mode]);

  const go = (target: number, dir: FlowDirection) => {
    setDirection(dir);
    setIndex(target);
  };

  const next = () => {
    const s = useBook.getState();
    let target = index + 1;
    // One goal is circled for you.
    if (steps[target] === 'circle' && s.goals.length === 1 && !mode) {
      s.circle(s.goals[0].id);
      target += 1;
    }
    if (target < steps.length) {
      haptics.selection();
      go(target, 'forward');
      return;
    }
    haptics.success();
    if (mode === 'reread') {
      s.markReread(appDay());
      navigation.replace('Plan');
    } else if (mode === 'reassess') {
      navigation.replace('Plan');
    } else {
      s.setSetup('vow');
      navigation.navigate('Pratigya');
    }
  };

  const back = () => {
    let target = index - 1;
    if (steps[target] === 'circle' && useBook.getState().goals.length === 1) {
      target -= 1;
    }
    if (target < 0) {
      navigation.goBack();
    } else {
      go(target, 'back');
    }
  };

  return (
    <FlowFrame
      testID="setup"
      stepKey={step}
      direction={direction}
      art={ART[step]}
      onBack={back}
      progress={{ total: steps.length, filled: index + 1 }}
      footer={
        <PrimaryButton
          testID="next-button"
          label={step === 'circle' ? t.circle.pick : t.common.next}
          disabled={!ready(step, state)}
          onPress={next}
        />
      }
    >
      <Sheet step={step} t={t} />
    </FlowFrame>
  );
}

function Sheet({ step, t }: { step: SheetStep; t: Strings }) {
  const state = useBook();
  switch (step) {
    case 'values':
      return (
        <>
          <QuestionHeader
            eyebrow={t.values.eyebrow}
            title={t.values.title}
            subtitle={`${t.values.sub} ${t.values.hint}`}
          />
          <QuestionBody gap={24}>
            <ValuesEditor />
          </QuestionBody>
        </>
      );
    case 'goals':
      return (
        <>
          <QuestionHeader
            eyebrow={t.goals.eyebrow}
            title={t.goals.title}
            subtitle={t.goals.sub}
          />
          <QuestionBody gap={24}>
            <GoalsEditor />
          </QuestionBody>
        </>
      );
    case 'circle':
      return (
        <>
          <QuestionHeader
            eyebrow={t.circle.eyebrow}
            title={t.circle.title}
            subtitle={t.circle.sub}
          />
          <QuestionBody gap={24}>
            <OptionList>
              {state.goals.map(g => (
                <OptionCard
                  key={g.id}
                  testID={`circle-${g.id}`}
                  title={g.text}
                  tag={t.goals.term(g.term)}
                  disabled={Boolean(g.doneAt)}
                  selected={state.circledGoalId === g.id}
                  onPress={() => state.circle(g.id)}
                />
              ))}
            </OptionList>
          </QuestionBody>
        </>
      );
    case 'milestones':
      return (
        <>
          <QuestionHeader
            eyebrow={t.milestones.eyebrow}
            title={circledGoal(state)?.text ?? ''}
          />
          <QuestionBody gap={20}>
            <View style={styles.rule}>
              <AppText variant="bodyMedium">{t.milestones.rule}</AppText>
              <AppText variant="caption">{t.milestones.example}</AppText>
            </View>
            <View style={styles.list}>
              <MilestonesEditor />
              <AppText variant="caption">{t.milestones.hint}</AppText>
            </View>
          </QuestionBody>
        </>
      );
    case 'tasks':
      return (
        <>
          <QuestionHeader
            eyebrow={t.tasks.eyebrow}
            title={t.tasks.title}
            subtitle={t.tasks.sub}
          />
          <QuestionBody gap={24}>
            <TasksEditor week={thisWeek(state)} />
          </QuestionBody>
        </>
      );
    case 'rhythm':
      return (
        <>
          <QuestionHeader
            eyebrow={t.rhythm.eyebrow}
            title={t.rhythm.title}
            subtitle={t.rhythm.sub}
          />
          <QuestionBody gap={24}>
            <RhythmEditor />
          </QuestionBody>
        </>
      );
  }
}

const styles = StyleSheet.create({
  rule: {
    gap: spacing.xs,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.parchment,
  },
  list: {
    marginTop: 20,
    gap: spacing.md,
  },
});
