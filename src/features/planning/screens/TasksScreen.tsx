import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { rise } from '../../../components/QuestionHeader';
import { SurfaceContext } from '../../../components/Surface';
import { TAB_BAR_CLEARANCE } from '../../../components/TabBar';
import type { Task } from '../../../types/models';
import { colors, motion, spacing } from '../../../theme';
import { now, today } from '../../../utils/clock';
import {
  addDays,
  daysBetween,
  formatWindow,
  formatWeekRange,
  startOfWeek,
} from '../../../utils/date';
import { addMonths } from '../../../utils/time';
import { haptics } from '../../../utils/haptics';
import { useGoalSetup } from '../../onboarding/store';
import { CardRow, SectionCard } from '../components/SectionCard';
import { TaskSheet } from '../components/TaskSheet';
import { DeepTaskRow, ShallowTaskRow } from '../components/TaskRow';
import { AddRow } from '../setup/SessionTimesStep';
import {
  isSacrificeDue,
  isTaskDone,
  planFor,
  tasksForWeek,
  usePlanning,
} from '../store';

/** The milestone being worked on now: the first one not yet due. */
function useCurrentMilestone(): string | null {
  const milestones = useGoalSetup(s => s.milestones);
  const thisMonth = addMonths(now(), 0);
  return (
    milestones.find(m => m.dueMonth >= thisMonth)?.text ??
    milestones.at(-1)?.text ??
    null
  );
}

export interface TasksScreenProps {
  onPlanTomorrow: () => void;
  onSacrifice: () => void;
}

/** This week's tasks: deep work by priority, then the shallow list. */
export function TasksScreen({ onPlanTomorrow, onSacrifice }: TasksScreenProps) {
  const insets = useSafeAreaInsets();
  const state = usePlanning();
  const toggleShallow = usePlanning(s => s.toggleShallow);
  const milestone = useCurrentMilestone();
  const [sheet, setSheet] = useState<{ task: Task | null } | null>(null);

  const day = today();
  const monday = startOfWeek(day);
  const week = state.startedOn
    ? Math.floor(daysBetween(startOfWeek(state.startedOn), monday) / 7) + 1
    : 1;

  const tasks = useMemo(() => tasksForWeek(state, day), [state, day]);
  const deep = tasks.filter(t => t.kind === 'deep');
  const shallow = tasks.filter(t => t.kind === 'shallow');
  const sessionsNeeded = deep.reduce((n, t) => n + t.sessionsNeeded, 0);
  const sessionsDone = deep.reduce(
    (n, t) => n + Math.min(t.sessionsDone, t.sessionsNeeded),
    0,
  );
  const tomorrow = planFor(state, addDays(day, 1));
  const sacrificeDue = isSacrificeDue(state, day);

  return (
    <SurfaceContext.Provider value={colors.white}>
      <ScrollView
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
          <AppText variant="eyebrow">{`Week ${week} · ${formatWeekRange(
            monday,
          )}`}</AppText>
          <AppText
            variant="title"
            style={styles.title}
            accessibilityRole="header"
          >
            This week
          </AppText>
          <AppText variant="micro" style={styles.subtitle}>
            {milestone
              ? `Milestone: ${milestone}`
              : 'Values > Goals > Milestones > Tasks > Sessions'}
          </AppText>
        </Animated.View>

        <Animated.View entering={rise(1)} style={styles.stack}>
          {sacrificeDue ? (
            <Nudge
              testID="sacrifice-nudge"
              text="Week 1 done. One more sheet."
              action="Write it"
              onPress={onSacrifice}
            />
          ) : null}
          {tomorrow.sealedAt ? (
            <Nudge
              testID="tomorrow-nudge"
              quiet
              text="Tomorrow is sealed"
              action="View"
              onPress={onPlanTomorrow}
            />
          ) : (
            <Nudge
              testID="tomorrow-nudge"
              text="Tomorrow isn’t sealed yet"
              action="Plan"
              onPress={onPlanTomorrow}
            />
          )}

          <SectionCard
            testID="deep-card"
            title="Deep work"
            meta={
              sessionsNeeded
                ? `${sessionsDone} of ${sessionsNeeded} sessions`
                : undefined
            }
          >
            {deep.length ? (
              deep.map((task, i) => (
                <CardRow key={task.id} last={i === deep.length - 1}>
                  <DeepTaskRow task={task} onPress={() => setSheet({ task })} />
                </CardRow>
              ))
            ) : (
              <Empty text="What moves the milestone this week? Add it as deep work." />
            )}
          </SectionCard>

          <SectionCard
            testID="shallow-card"
            title={`Shallow · ${formatWindow(
              state.shallowWindow.start,
              state.shallowWindow.end,
            )}`}
            meta={
              shallow.length
                ? `${shallow.filter(isTaskDone).length} of ${shallow.length}`
                : undefined
            }
          >
            {shallow.length ? (
              shallow.map((task, i) => (
                <CardRow key={task.id} last={i === shallow.length - 1}>
                  <ShallowTaskRow
                    task={task}
                    onToggle={() => toggleShallow(task.id)}
                    onEdit={() => setSheet({ task })}
                  />
                </CardRow>
              ))
            ) : (
              <Empty text="Calls, payments, errands. They wait for this window." />
            )}
          </SectionCard>

          <AddRow
            testID="task-add"
            label="+  Add a task"
            onPress={() => setSheet({ task: null })}
          />
        </Animated.View>
      </ScrollView>
      <TaskSheet
        visible={sheet !== null}
        task={sheet?.task}
        onClose={() => setSheet(null)}
      />
    </SurfaceContext.Provider>
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
});
