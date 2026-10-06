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
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="heading">{progress.goal}</AppText>
          {g.action ? (
            <AppText variant="caption" style={styles.action}>
              {g.action}
            </AppText>
          ) : null}
        </View>
        <Pressable
          testID="milestones-edit"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => setEditing(e => !e)}
          style={styles.editPill}
        >
          <AppText variant="label" style={styles.saffron}>
            {editing ? 'Done' : 'Edit'}
          </AppText>
        </Pressable>
      </View>

      {editing ? (
        <Animated.View
          entering={FadeIn.duration(motion.base)}
          style={styles.card}
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
        <View style={styles.list}>
          {rows.map(({ m, size, done }, i) => {
            const expanded = i === open;
            const finished = done >= size;
            const now = i === current;
            return (
              <Animated.View
                key={m.id}
                layout={LinearTransition.duration(motion.base)}
                style={[styles.card, now && styles.cardNow]}
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
                  <AppText
                    variant={now ? 'bodyBold' : 'body'}
                    style={[styles.flex, finished && styles.muted]}
                  >
                    {m.text}
                  </AppText>
                  <AppText
                    variant="bodyBold"
                    style={
                      now ? styles.saffron : finished ? styles.muted : null
                    }
                  >
                    {repeated ? `${done}/${size}` : shortMonthLabel(m.dueMonth)}
                  </AppText>
                  <ChevronDown
                    width={18}
                    height={18}
                    color={colors.textMuted}
                    strokeWidth={1.8}
                    style={{
                      transform: [{ rotate: expanded ? '180deg' : '0deg' }],
                    }}
                  />
                </Pressable>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${(done / size) * 100}%`,
                        backgroundColor: now ? colors.saffron : colors.charcoal,
                      },
                    ]}
                  />
                </View>
                {expanded && now ? (
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
                            variant="body"
                            style={[
                              styles.flex,
                              isTaskDone(t) ? styles.muted : null,
                            ]}
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
          })}
        </View>
      )}
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  action: {
    marginTop: spacing.sm,
    color: colors.textMuted,
  },
  editPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.white,
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
  list: {
    gap: 14,
  },
  card: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    borderRadius: 18,
    backgroundColor: colors.white,
    boxShadow: '0px 8px 20px rgba(60, 30, 10, 0.05)',
  },
  cardNow: {
    boxShadow: '0px 12px 28px rgba(196, 120, 50, 0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  track: {
    marginTop: 16,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  week: {
    marginTop: 22,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    gap: 16,
  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ring: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.4,
    borderColor: colors.saffron,
  },
  ringDone: {
    backgroundColor: colors.saffron,
  },
});
