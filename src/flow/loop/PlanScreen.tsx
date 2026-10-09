import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { ListField } from '../../components/ListField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SimpleScreen } from '../../components/SimpleScreen';
import { TextField } from '../../components/TextField';
import { appDay, appMinutes, weekStart } from '../../core/days';
import { planDateFor, sessionsOn } from '../../core/home';
import { LIMITS, MINUTE_CHIPS } from '../../core/model';
import {
  finishReassess,
  lastDontDo,
  lastFinished,
  tasksForWeek,
  useBook,
} from '../../core/store';
import { useT } from '../../i18n';
import { clock, dayDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import type { Id, ISODate, SheetLine } from '../../types/models';
import { addDays } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { createId } from '../../utils/id';
import { TasksEditor } from '../components/SheetEditors';

interface Draft {
  key: string;
  id?: Id;
  taskId?: Id;
  other: boolean;
  what: string;
  outcome: string;
  minutes: number;
  challenge: string;
  steps: string;
  risks: string;
  dontDo: SheetLine[];
  open: boolean;
}

const lines = (xs: string[]): SheetLine[] =>
  xs.map(text => ({ id: createId('dont'), text }));

/**
 * Plan one day: up to three sessions, each with what exactly, the exact
 * outcome and the time. More clarity (challenge, steps, risks, don't-do)
 * is folded away and pre-filled from the last session.
 */
export function PlanScreen({ navigation, route }: RootScreenProps<'Plan'>) {
  const t = useT();
  const state = useBook();
  const today = appDay();
  const tomorrow = addDays(today, 1);
  const [date, setDate] = useState<ISODate>(
    route.params?.date ?? planDateFor(state, today, appMinutes()),
  );
  const first = route.params?.first ?? false;
  const open = tasksForWeek(state, date, 'deep').filter(x => !x.done);
  const weekEmpty = tasksForWeek(state, date, 'deep').length === 0;
  const finished = lastFinished(state.sessions);
  const dont = lastDontDo(state.sessions);

  const fresh = (): Draft => ({
    key: createId('draft'),
    other: false,
    what: '',
    outcome: '',
    minutes: state.rhythm.focusMinutes,
    challenge: finished ? t.plan.challengeFrom(finished) : '',
    steps: '',
    risks: '',
    dontDo: lines(dont),
    open: false,
  });

  const load = (d: ISODate): Draft[] => {
    const existing = sessionsOn(state, d).filter(s => !s.startedAt && !s.mark);
    return existing.length
      ? existing.map(s => ({
          key: s.id,
          id: s.id,
          taskId: s.taskId,
          other: !s.taskId,
          what: s.what,
          outcome: s.outcome,
          minutes: s.minutes,
          challenge: s.challenge ?? '',
          steps: s.steps ?? '',
          risks: s.risks ?? '',
          dontDo: lines(s.dontDo ?? []),
          open: false,
        }))
      : [fresh()];
  };
  const [drafts, setDrafts] = useState<Draft[]>(() => load(date));
  const locked = sessionsOn(state, date).filter(s => s.startedAt || s.mark);

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts(ds => ds.map(d => (d.key === key ? { ...d, ...patch } : d)));

  const complete = drafts.every(
    d =>
      d.what.trim().length >= 2 &&
      d.outcome.trim().length >= 2 &&
      d.minutes > 0,
  );

  const save = () => {
    const s = useBook.getState();
    // Replace this day's unstarted sessions with the drafts.
    sessionsOn(s, date)
      .filter(x => !x.startedAt && !x.mark && !drafts.some(d => d.id === x.id))
      .forEach(x => s.deleteSession(x.id));
    let start = Math.max(
      state.rhythm.focusStart,
      ...locked.map(l => l.start + l.minutes),
    );
    drafts.forEach((d, i) => {
      s.saveSession({
        id: d.id,
        date,
        order: locked.length + i,
        taskId: d.other ? undefined : d.taskId,
        what: d.what.trim(),
        outcome: d.outcome.trim(),
        minutes: d.minutes,
        start,
        challenge: d.challenge.trim() || undefined,
        steps: d.steps.trim() || undefined,
        risks: d.risks.trim() || undefined,
        dontDo: d.dontDo.map(x => x.text).filter(Boolean),
      });
      start += d.minutes;
    });
    haptics.success();
    if (first) {
      s.setSetup('done');
      navigation.reset({ index: 0, routes: [{ name: 'SetupDone' }] });
      return;
    }
    if (s.reassessing) {
      finishReassess();
    }
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const switchDate = (d: ISODate) => {
    setDate(d);
    setDrafts(load(d));
  };

  return (
    <SimpleScreen
      testID="plan"
      tone="parchment"
      hideBack={first}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="plan-save"
          label={t.common.save}
          disabled={!complete || weekEmpty}
          onPress={save}
        />
      }
    >
      <QuestionHeader
        eyebrow={dayDate(t, date)}
        title={t.plan.title}
        subtitle={t.plan.why}
      />
      <QuestionBody gap={24}>
        <View style={styles.group}>
          <AppText variant="eyebrow">{t.plan.for}</AppText>
          <SegmentedControl<ISODate>
            testIDPrefix="plan-for"
            value={date}
            segments={[
              { id: today, label: t.common.today },
              { id: tomorrow, label: t.common.tomorrow },
            ]}
            onChange={switchDate}
          />
        </View>

        {weekEmpty ? (
          <Animated.View
            entering={FadeIn.duration(motion.base)}
            style={styles.week}
          >
            <AppText variant="bodyMedium">{t.plan.emptyWeek}</AppText>
            <TasksEditor
              week={weekStart(date, state.rhythm.reviewDay)}
              showShallow={false}
            />
          </Animated.View>
        ) : null}

        {drafts.map((d, i) => (
          <Animated.View
            key={d.key}
            layout={LinearTransition.duration(motion.base)}
            entering={FadeInDown.duration(motion.base)}
            exiting={FadeOut.duration(motion.fast)}
            style={styles.card}
          >
            <View style={styles.cardHead}>
              <AppText variant="eyebrow">
                {`${t.common.session(locked.length + i + 1)} · ${clock(
                  t,
                  Math.max(
                    state.rhythm.focusStart,
                    ...locked.map(l => l.start + l.minutes),
                  ) + drafts.slice(0, i).reduce((n, x) => n + x.minutes, 0),
                )}`}
              </AppText>
              {drafts.length > 1 ? (
                <Pressable
                  testID={`remove-${i}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() =>
                    setDrafts(ds => ds.filter(x => x.key !== d.key))
                  }
                >
                  <AppText variant="label" style={styles.danger}>
                    {t.plan.removeSession}
                  </AppText>
                </Pressable>
              ) : null}
            </View>

            <AppText variant="eyebrow" style={styles.label}>
              {t.plan.task}
            </AppText>
            <ChipRow>
              {open.map(task => (
                <Chip
                  key={task.id}
                  testID={`pick-${i}-${task.id}`}
                  role="radio"
                  label={task.text}
                  selected={!d.other && d.taskId === task.id}
                  onPress={() =>
                    update(d.key, {
                      taskId: task.id,
                      other: false,
                      what: task.text,
                    })
                  }
                />
              ))}
              <Chip
                testID={`pick-${i}-other`}
                role="radio"
                label={t.plan.other}
                selected={d.other}
                onPress={() =>
                  update(d.key, { other: true, taskId: undefined, what: '' })
                }
              />
            </ChipRow>

            <Field label={t.plan.what}>
              <TextField
                testID={`what-${i}`}
                accessibilityLabel={t.plan.what}
                value={d.what}
                onChangeText={what => update(d.key, { what })}
                placeholder={t.plan.otherPlaceholder}
                maxLength={70}
              />
            </Field>
            <Field label={t.plan.outcome}>
              <TextField
                testID={`outcome-${i}`}
                accessibilityLabel={t.plan.outcome}
                value={d.outcome}
                onChangeText={outcome => update(d.key, { outcome })}
                placeholder={t.plan.outcomePlaceholder}
                maxLength={90}
              />
            </Field>
            <Field label={t.plan.time}>
              <ChipRow>
                {MINUTE_CHIPS.map(m => (
                  <Chip
                    key={m}
                    testID={`time-${i}-${m}`}
                    role="radio"
                    label={t.common.minutes(m)}
                    selected={d.minutes === m}
                    onPress={() => update(d.key, { minutes: m })}
                  />
                ))}
              </ChipRow>
            </Field>

            <Pressable
              testID={`more-${i}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: d.open }}
              onPress={() => {
                haptics.selection();
                update(d.key, { open: !d.open });
              }}
              style={styles.more}
            >
              <AppText variant="label" style={styles.muted}>
                {t.plan.more}
              </AppText>
              <ChevronDown
                width={16}
                height={16}
                color={colors.textMuted}
                style={{ transform: [{ rotate: d.open ? '180deg' : '0deg' }] }}
              />
            </Pressable>
            {d.open ? (
              <Animated.View
                entering={FadeIn.duration(motion.base)}
                style={styles.moreBody}
              >
                <Field label={t.plan.challenge}>
                  <TextField
                    testID={`challenge-${i}`}
                    accessibilityLabel={t.plan.challenge}
                    value={d.challenge}
                    onChangeText={challenge => update(d.key, { challenge })}
                    multiline
                  />
                </Field>
                <Field label={t.plan.steps}>
                  <TextField
                    testID={`steps-${i}`}
                    accessibilityLabel={t.plan.steps}
                    value={d.steps}
                    onChangeText={steps => update(d.key, { steps })}
                    placeholder={t.plan.stepsPlaceholder}
                    multiline
                  />
                </Field>
                <Field label={t.plan.risks}>
                  <TextField
                    testID={`risks-${i}`}
                    accessibilityLabel={t.plan.risks}
                    value={d.risks}
                    onChangeText={risks => update(d.key, { risks })}
                    placeholder={t.plan.risksPlaceholder}
                    multiline
                  />
                </Field>
                <Field label={t.plan.dontDo}>
                  <ListField
                    testID={`dont-${i}`}
                    items={d.dontDo}
                    onChange={dontDo => update(d.key, { dontDo })}
                    max={8}
                    addLabel={t.plan.dontDoPlaceholder}
                    idPrefix="dont"
                  />
                </Field>
              </Animated.View>
            ) : null}
          </Animated.View>
        ))}

        {locked.length + drafts.length < LIMITS.sessionsPerDay ? (
          <Pressable
            testID="add-session"
            accessibilityRole="button"
            onPress={() => {
              haptics.tap();
              setDrafts(ds => [...ds, fresh()]);
            }}
            style={styles.add}
          >
            <AppText variant="bodyMedium" style={styles.saffron}>
              {`+  ${t.plan.addSession(locked.length + drafts.length + 1)}`}
            </AppText>
          </Pressable>
        ) : null}
        <AppText variant="caption" style={styles.center}>
          {t.plan.oneNight}
        </AppText>
      </QuestionBody>
    </SimpleScreen>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="eyebrow">{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.md,
  },
  week: {
    marginTop: 24,
    gap: spacing.lg,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  card: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.white,
    gap: spacing.md,
    boxShadow: '0px 8px 20px rgba(60, 30, 10, 0.05)',
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    marginTop: spacing.sm,
  },
  field: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  moreBody: {
    gap: spacing.sm,
  },
  add: {
    marginTop: 18,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  muted: {
    color: colors.textMuted,
  },
  saffron: {
    color: colors.saffron,
  },
  danger: {
    color: colors.danger,
  },
  center: {
    marginTop: 18,
    textAlign: 'center',
  },
});
