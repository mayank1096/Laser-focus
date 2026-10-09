import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Check from '../../assets/icons/check.svg';
import ChevronRight from '../../assets/icons/chevron-right.svg';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { appDay } from '../../core/days';
import { activeMilestones, dayMark } from '../../core/home';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { shortDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { addDays } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { WeekRow } from '../components/MarkBox';
import { TasksEditor } from '../components/SheetEditors';

/**
 * One screen, top to bottom: the week's boxes, the milestones, the bore-sit,
 * last week's tasks (done or carried), next week's tasks, and after the
 * first week two optional course sheets. It never blocks planning.
 */
export function ReviewScreen({ navigation, route }: RootScreenProps<'Review'>) {
  const t = useT();
  const { week } = route.params;
  const state = useBook();
  const [boreSit, setBoreSit] = useState(
    state.reviews.find(r => r.week === week)?.boreSit ?? false,
  );
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const next = addDays(week, 7);
  const milestones = activeMilestones(state);
  const lastTasks = state.tasks.filter(
    x => x.week === week && x.kind === 'deep',
  );
  const carried = (text: string) =>
    state.tasks.some(x => x.week === next && x.text === text);
  const firstWeek = state.reviews.length === 0;

  const save = () => {
    const s = useBook.getState();
    s.saveReview(week, boreSit);
    haptics.success();
    const ms = activeMilestones(s);
    navigation.reset({
      index: 0,
      routes: [
        { name: ms.length && ms.every(m => m.done) ? 'GoalDone' : 'Home' },
      ],
    });
  };

  return (
    <SimpleScreen
      testID="review"
      tone="parchment"
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="review-save"
          label={t.review.save}
          onPress={save}
        />
      }
    >
      <QuestionHeader
        eyebrow={`${shortDate(t, week)} – ${shortDate(t, addDays(week, 6))}`}
        title={t.review.title}
        subtitle={t.review.why}
      />
      <QuestionBody>
        <Section title={t.review.week}>
          <WeekRow
            days={days}
            marks={days.map(d => dayMark(state, d))}
            today={appDay()}
            letters={t.common.dayLetter}
          />
        </Section>

        <Section title={t.review.milestones}>
          {milestones.map(m => (
            <CheckRow
              key={m.id}
              testID={`ms-${m.id}`}
              label={m.text}
              checked={m.done}
              onPress={() => state.toggleMilestone(m.id)}
            />
          ))}
        </Section>

        <Section>
          <CheckRow
            testID="bore-sit"
            label={t.review.boreSit}
            checked={boreSit}
            onPress={() => setBoreSit(b => !b)}
          />
        </Section>

        {lastTasks.length ? (
          <Section title={t.review.lastTasks}>
            {lastTasks.map(task => (
              <View key={task.id} style={styles.taskRow}>
                <AppText
                  variant="body"
                  style={[styles.flex, task.done && styles.struck]}
                >
                  {task.text}
                </AppText>
                <Toggle
                  testID={`done-${task.id}`}
                  label={t.review.doneTask}
                  on={task.done}
                  onPress={() => state.toggleTask(task.id)}
                />
                {task.done ? null : (
                  <Toggle
                    testID={`carry-${task.id}`}
                    label={
                      carried(task.text) ? t.review.carried : t.review.carry
                    }
                    on={carried(task.text)}
                    onPress={() => state.carryOver(task.id, next)}
                  />
                )}
              </View>
            ))}
          </Section>
        ) : null}

        <Section title={t.review.nextTasks}>
          <TasksEditor week={next} />
        </Section>

        {!firstWeek ? (
          <Section title={t.review.optional}>
            <Row
              testID="open-antigoal"
              title={t.review.antiGoal}
              sub={t.review.antiGoalSub}
              onPress={() =>
                navigation.navigate('BookSheet', { sheet: 'antiGoal' })
              }
            />
            <Row
              testID="open-sacrifice"
              title={t.review.sacrifice}
              sub={t.review.sacrificeSub}
              onPress={() =>
                navigation.navigate('BookSheet', { sheet: 'sacrifice' })
              }
            />
          </Section>
        ) : null}
      </QuestionBody>
    </SimpleScreen>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <AppText variant="eyebrow">{title}</AppText> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function CheckRow({
  label,
  checked,
  onPress,
  testID,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={styles.check}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? (
          <Check
            width={14}
            height={14}
            color={colors.white}
            strokeWidth={2.4}
          />
        ) : null}
      </View>
      <AppText variant="body" style={[styles.flex, checked && styles.struck]}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Toggle({
  label,
  on,
  onPress,
  testID,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={6}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={[styles.toggle, on && styles.toggleOn]}
    >
      <AppText variant="micro" style={on ? styles.onText : styles.muted}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Row({
  title,
  sub,
  onPress,
  testID,
}: {
  title: string;
  sub: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.flex}>
        <AppText variant="bodyMedium">{title}</AppText>
        <AppText variant="micro" style={styles.muted}>
          {sub}
        </AppText>
      </View>
      <ChevronRight width={18} height={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.group,
    gap: spacing.label,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: spacing.xl,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  flex: {
    flex: 1,
  },
  struck: {
    color: colors.textMuted,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  toggleOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  onText: {
    color: colors.white,
  },
  muted: {
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});
