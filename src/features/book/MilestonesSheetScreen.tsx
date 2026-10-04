import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { AppText } from '../../components/AppText';
import { ListField } from '../../components/ListField';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import { today } from '../../utils/clock';
import { shortMonthLabel } from '../../utils/time';
import { haptics } from '../../utils/haptics';
import { LIMITS, useGoalSetup } from '../onboarding/store';
import { isTaskDone, tasksForWeek, usePlanning } from '../planning/store';
import { useGoalProgress } from '../progress';
import { SheetPage } from './components/SheetPage';

/** How many units each milestone covers when the work is repeated. */
function batches(total: number, count: number): number[] {
  const size = Math.ceil(total / Math.max(1, count));
  return Array.from({ length: count }, (_, i) =>
    Math.max(0, Math.min(size, total - i * size)),
  );
}

export function MilestonesSheetScreen({
  navigation,
}: RootScreenProps<'MilestonesSheet'>) {
  const g = useGoalSetup();
  const planning = usePlanning();
  const progress = useGoalProgress();
  const [editing, setEditing] = useState(false);
  const repeated = g.workShape === 'repeated';
  const sizes = batches(g.targetCount, g.milestones.length);
  let before = 0;
  const rows = g.milestones.map((m, i) => {
    const size = repeated ? sizes[i] : 1;
    const done = Math.max(0, Math.min(size, progress.done - before));
    before += size;
    return { m, size, done };
  });
  const current = rows.findIndex(r => r.done < r.size);
  const [open, setOpen] = useState(current === -1 ? 0 : current);
  const week = tasksForWeek(planning, today()).filter(t => t.kind === 'deep');

  return (
    <SheetPage
      testID="milestones-sheet"
      eyebrow="Every few months"
      title="Milestones"
      subtitle="Practical, precise, trackable."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.card}>
        <View style={styles.head}>
          <AppText variant="heading" style={styles.flex}>
            {progress.goal}
          </AppText>
          <Pressable
            testID="milestones-edit"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setEditing(e => !e)}
          >
            <AppText variant="label" style={styles.saffron}>
              {editing ? 'Done' : 'Edit'}
            </AppText>
          </Pressable>
        </View>
        {g.action ? (
          <AppText variant="micro" style={styles.muted}>
            {g.action}
          </AppText>
        ) : null}

        {editing ? (
          <Animated.View
            entering={FadeIn.duration(motion.base)}
            style={styles.edit}
          >
            <ListField
              testID="milestones-sheet-list"
              items={g.milestones}
              onChange={g.setMilestones}
              max={LIMITS.milestones.max}
              addLabel="Add a milestone"
              idPrefix="milestone"
            />
          </Animated.View>
        ) : (
          rows.map(({ m, size, done }, i) => {
            const expanded = i === open;
            const finished = done >= size;
            return (
              <Animated.View
                key={m.id}
                layout={LinearTransition.duration(motion.base)}
                style={styles.milestone}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  onPress={() => {
                    haptics.selection();
                    setOpen(expanded ? -1 : i);
                  }}
                  style={styles.row}
                >
                  <ChevronDown
                    width={14}
                    height={14}
                    color={colors.textMuted}
                    strokeWidth={2}
                    style={{
                      transform: [{ rotate: expanded ? '0deg' : '-90deg' }],
                    }}
                  />
                  <AppText
                    variant={i === current ? 'bodyBold' : 'body'}
                    style={[styles.flex, finished && styles.muted]}
                  >
                    {m.text}
                  </AppText>
                  <AppText
                    variant="bodyBold"
                    style={i === current ? styles.saffron : null}
                  >
                    {repeated ? `${done}/${size}` : shortMonthLabel(m.dueMonth)}
                  </AppText>
                </Pressable>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${(done / size) * 100}%`,
                        backgroundColor:
                          i === current ? colors.saffron : colors.charcoal,
                      },
                    ]}
                  />
                </View>
                {expanded && i === current ? (
                  <Animated.View
                    entering={FadeIn.duration(motion.base)}
                    style={styles.week}
                  >
                    <AppText variant="eyebrow">This week</AppText>
                    {week.length ? (
                      week.map(t => (
                        <View key={t.id} style={styles.task}>
                          <View
                            style={[
                              styles.ring,
                              isTaskDone(t) && styles.ringDone,
                            ]}
                          />
                          <AppText
                            variant="label"
                            style={isTaskDone(t) ? styles.muted : null}
                          >
                            {t.text}
                          </AppText>
                        </View>
                      ))
                    ) : (
                      <AppText variant="caption">
                        No deep work planned this week.
                      </AppText>
                    )}
                  </Animated.View>
                ) : null}
              </Animated.View>
            );
          })
        )}
      </View>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 14,
    backgroundColor: colors.white,
    boxShadow: '0px 10px 24px rgba(0, 0, 0, 0.06)',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  saffron: {
    color: colors.saffron,
  },
  muted: {
    color: colors.textMuted,
  },
  edit: {
    marginTop: spacing.md,
  },
  milestone: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  track: {
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: 2,
  },
  week: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingLeft: spacing.xl,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderLeftColor: colors.border,
    marginLeft: spacing.xs,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  ring: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.2,
    borderColor: colors.saffron,
  },
  ringDone: {
    backgroundColor: colors.saffron,
  },
});
