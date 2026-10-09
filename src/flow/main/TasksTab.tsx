import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Check from '../../assets/icons/check.svg';
import { AppText } from '../../components/AppText';
import { rise } from '../../components/QuestionHeader';
import { SurfaceContext } from '../../components/Surface';
import { TAB_BAR_CLEARANCE } from '../../components/TabBar';
import { appDay, appMinutes, weekStart } from '../../core/days';
import {
  activeMilestones,
  planDateFor,
  reviewDue,
  sessionsOn,
} from '../../core/home';
import type { WeekTask } from '../../core/model';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { shortDate } from '../../i18n/format';
import { colors, layout, motion, radii, spacing } from '../../theme';
import type { ISODate } from '../../types/models';
import { addDays, daysBetween } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { CardRow, SectionCard } from '../components/SectionCard';

/** This week's tasks: deep work linked to milestones, then the shallow list. */
export function TasksTab({
  onPlan,
  onReview,
  onEdit,
}: {
  onPlan: (date: ISODate) => void;
  onReview: (week: ISODate) => void;
  onEdit: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const state = useBook();
  const today = appDay();
  const week = weekStart(today, state.rhythm.reviewDay);
  const n = state.sprintStart
    ? Math.max(
        1,
        Math.floor(
          daysBetween(
            weekStart(state.sprintStart, state.rhythm.reviewDay),
            week,
          ) / 7,
        ) + 1,
      )
    : 1;
  const ms = activeMilestones(state);
  const current = ms.find(m => !m.done) ?? ms.at(-1);
  const deep = state.tasks.filter(x => x.week === week && x.kind === 'deep');
  const shallow = state.tasks.filter(
    x => x.week === week && x.kind === 'shallow',
  );
  const review = reviewDue(state, today);
  const planDate = planDateFor(state, today, appMinutes());
  const dayName = planDate === today ? t.common.today : t.common.tomorrow;
  const planned = sessionsOn(state, planDate).length > 0;

  const milestoneOf = (task: WeekTask) => {
    const i = ms.findIndex(m => m.id === task.milestoneId);
    return i >= 0 ? `M${i + 1} · ${ms[i].text}` : t.tasksTab.noMilestone;
  };

  return (
    <SurfaceContext.Provider value={colors.white}>
      <ScrollView
        testID="tasks-tab"
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={rise(0)} style={styles.header}>
          <AppText variant="eyebrow">
            {t.tasksTab.week(
              n,
              `${shortDate(t, week)} – ${shortDate(t, addDays(week, 6))}`,
            )}
          </AppText>
          <AppText
            variant="title"
            style={styles.title}
            accessibilityRole="header"
          >
            {t.tasksTab.title}
          </AppText>
          {current ? (
            <AppText variant="micro" style={styles.subtitle}>
              {t.tasksTab.milestone(current.text)}
            </AppText>
          ) : null}
        </Animated.View>

        <Animated.View entering={rise(1)} style={styles.stack}>
          {review ? (
            <Nudge
              testID="review-nudge"
              text={t.tasksTab.reviewDue}
              action={t.tasksTab.review}
              onPress={() => onReview(review)}
            />
          ) : null}
          <Nudge
            testID="plan-nudge"
            quiet={planned}
            text={
              planned
                ? t.tasksTab.planned(dayName)
                : t.tasksTab.notPlanned(dayName)
            }
            action={planned ? t.tasksTab.view : t.tasksTab.plan}
            onPress={() => onPlan(planDate)}
          />

          <SectionCard
            testID="deep-card"
            title={t.tasksTab.deep}
            meta={
              deep.length
                ? t.tasksTab.deepMeta(
                    deep.filter(x => x.done).length,
                    deep.length,
                  )
                : undefined
            }
          >
            {deep.length ? (
              deep.map((task, i) => (
                <CardRow key={task.id} last={i === deep.length - 1}>
                  <TaskRow
                    task={task}
                    meta={milestoneOf(task)}
                    onToggle={() => state.toggleTask(task.id)}
                    onEdit={onEdit}
                  />
                </CardRow>
              ))
            ) : (
              <Empty text={t.tasksTab.deepEmpty} />
            )}
          </SectionCard>

          <SectionCard
            testID="shallow-card"
            title={t.tasksTab.shallow}
            meta={
              shallow.length
                ? `${shallow.filter(x => x.done).length}/${shallow.length}`
                : undefined
            }
          >
            {shallow.length ? (
              shallow.map((task, i) => (
                <CardRow key={task.id} last={i === shallow.length - 1}>
                  <TaskRow
                    task={task}
                    onToggle={() => state.toggleTask(task.id)}
                    onEdit={onEdit}
                  />
                </CardRow>
              ))
            ) : (
              <Empty text={t.tasksTab.shallowEmpty} />
            )}
          </SectionCard>

          <Pressable
            testID="task-add"
            accessibilityRole="button"
            onPress={() => {
              haptics.tap();
              onEdit();
            }}
            style={({ pressed }) => [styles.add, pressed && styles.pressed]}
          >
            <AppText variant="body" style={styles.addLabel}>
              {t.tasksTab.add}
            </AppText>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SurfaceContext.Provider>
  );
}

/** A tick circle and the task. Tap to tick; long-press to edit the list. */
function TaskRow({
  task,
  meta,
  onToggle,
  onEdit,
}: {
  task: WeekTask;
  meta?: string;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <Pressable
      testID={`task-${task.id}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.done }}
      accessibilityLabel={task.text}
      onPress={() => {
        if (task.done) {
          haptics.selection();
        } else {
          haptics.success();
        }
        onToggle();
      }}
      onLongPress={() => {
        haptics.confirm();
        onEdit();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, task.done && styles.boxOn]}>
        {task.done ? (
          <Animated.View entering={FadeIn.duration(motion.fast)}>
            <Check
              width={11}
              height={11}
              color={colors.white}
              strokeWidth={3}
            />
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.text}>
        <AppText
          variant={meta ? 'bodyMedium' : 'body'}
          style={task.done && styles.struck}
          numberOfLines={2}
        >
          {task.text}
        </AppText>
        {meta ? (
          <AppText variant="micro" style={styles.meta} numberOfLines={1}>
            {meta}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function Nudge({
  text,
  action,
  onPress,
  quiet = false,
  testID,
}: {
  text: string;
  action: string;
  onPress: () => void;
  quiet?: boolean;
  testID?: string;
}) {
  return (
    <Animated.View
      layout={LinearTransition.duration(motion.base)}
      entering={FadeIn.duration(motion.base)}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${text}. ${action}`}
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        style={({ pressed }) => [
          styles.nudge,
          quiet ? styles.nudgeQuiet : styles.nudgeLoud,
          pressed && styles.pressed,
        ]}
      >
        <AppText variant="bodyMedium" style={styles.flex}>
          {text}
        </AppText>
        <AppText
          variant="label"
          style={{ color: quiet ? colors.textMuted : colors.saffron }}
        >
          {`${action}  →`}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <AppText variant="caption">{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    paddingHorizontal: 22,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  title: {
    marginTop: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  stack: {
    gap: spacing.lg,
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  nudgeLoud: {
    backgroundColor: colors.saffronWash,
    borderColor: colors.saffronLine,
  },
  nudgeQuiet: {
    backgroundColor: colors.stone,
    borderColor: colors.divider,
  },
  pressed: {
    opacity: 0.7,
  },
  flex: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: 14,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg + 1,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  meta: {
    color: colors.textMuted,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  struck: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  add: {
    minHeight: layout.fieldHeight + 4,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  addLabel: {
    color: colors.textGhost,
  },
});
