import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import Plus from '../../assets/icons/plus.svg';
import Target from '../../assets/icons/target.svg';
import X from '../../assets/icons/x.svg';
import { AppText } from '../../components/AppText';
import { ListField } from '../../components/ListField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { Pill, PillRow, SectionHeader } from '../../components/Pill';
import { SegmentedControl, TRACK } from '../../components/SegmentedControl';
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

  // Each session's window, following the focus slot and earlier sessions.
  const startOf = (i: number) =>
    Math.max(state.rhythm.focusStart, ...locked.map(l => l.start + l.minutes)) +
    drafts.slice(0, i).reduce((n, x) => n + x.minutes, 0);

  return (
    <SimpleScreen
      testID="plan"
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
      <QuestionBody>
        <SegmentedControl<ISODate>
          testIDPrefix="plan-for"
          value={date}
          segments={[
            { id: today, label: t.common.today },
            { id: tomorrow, label: t.common.tomorrow },
          ]}
          onChange={switchDate}
        />

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
            style={styles.session}
          >
            <SectionHeader
              Icon={Target}
              title={t.common.session(locked.length + i + 1)}
              value={t.plan.window(
                clock(t, startOf(i)),
                clock(t, startOf(i) + d.minutes),
              )}
              right={
                drafts.length > 1 ? (
                  <Pressable
                    testID={`remove-${i}`}
                    accessibilityRole="button"
                    accessibilityLabel={t.plan.removeSession}
                    hitSlop={10}
                    onPress={() =>
                      setDrafts(ds => ds.filter(x => x.key !== d.key))
                    }
                    style={styles.remove}
                  >
                    <X width={16} height={16} color={colors.textMuted} />
                  </Pressable>
                ) : null
              }
            />

            <Field label={t.plan.task}>
              <PillRow>
                {open.map(task => (
                  <Pill
                    key={task.id}
                    testID={`pick-${i}-${task.id}`}
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
                <Pill
                  testID={`pick-${i}-other`}
                  Icon={Plus}
                  label={t.plan.other}
                  selected={d.other}
                  onPress={() =>
                    update(d.key, { other: true, taskId: undefined, what: '' })
                  }
                />
              </PillRow>
            </Field>

            {d.other || d.taskId ? (
              <Animated.View entering={FadeIn.duration(motion.base)}>
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
              </Animated.View>
            ) : null}

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
              <SegmentedControl<number>
                value={d.minutes}
                segments={MINUTE_CHIPS.map(m => ({
                  id: m,
                  label: t.common.minutes(m),
                  testID: `time-${i}-${m}`,
                }))}
                onChange={m => update(d.key, { minutes: m })}
              />
            </Field>

            <Pressable
              testID={`more-${i}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: d.open }}
              onPress={() => {
                haptics.selection();
                update(d.key, { open: !d.open });
              }}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}
            >
              <View style={styles.moreText}>
                <AppText variant="bodyMedium">{t.plan.more}</AppText>
                <AppText variant="detail">{t.plan.moreSub}</AppText>
              </View>
              <ChevronDown
                width={18}
                height={18}
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
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          >
            <Plus width={18} height={18} color={colors.ink} />
            <AppText variant="bodyMedium">
              {t.plan.addSession(locked.length + drafts.length + 1)}
            </AppText>
          </Pressable>
        ) : null}
        <AppText variant="detail" style={styles.center}>
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
  week: {
    marginTop: spacing.group,
    gap: spacing.xl,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.stone,
  },
  // Each session is a section of its own, set off by a hairline.
  session: {
    marginTop: 36,
    paddingTop: 32,
    gap: spacing.xxl,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.divider,
  },
  remove: {
    width: 32,
    height: 32,
    marginLeft: spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TRACK,
  },
  field: {
    gap: spacing.label,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: TRACK,
  },
  moreText: {
    flex: 1,
    gap: spacing.xs,
  },
  moreBody: {
    gap: spacing.xxl,
  },
  pressed: {
    opacity: 0.7,
  },
  add: {
    marginTop: 36,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  center: {
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
});
