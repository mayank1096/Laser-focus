import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ChevronRight from '../../assets/icons/chevron-right.svg';
import { AppText } from '../../components/AppText';
import { TAB_BAR_CLEARANCE } from '../../components/TabBar';
import { appDay, weekStart } from '../../core/days';
import { activeMilestones } from '../../core/home';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { shortDate } from '../../i18n/format';
import type { BookSheet } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import { addDays } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { SheetPage } from '../components/SheetPage';

export type BookDestination = BookSheet | 'tasks' | 'sessions';

/**
 * The sheets, in the order the course builds them: from once in a lifetime
 * down to every night. A thread on the left ties them together.
 */
export function BookTab({ onOpen }: { onOpen: (to: BookDestination) => void }) {
  const t = useT();
  const state = useBook();
  const today = appDay();
  const week = weekStart(today, state.rhythm.reviewDay);
  const ms = activeMilestones(state);
  const done = ms.filter(m => m.done).length;
  const tasks = state.tasks.filter(x => x.week === week);

  const rows: {
    id: BookDestination;
    title: string;
    meta: string;
    bar?: { done: number; total: number };
  }[] = [
    { id: 'values', title: t.bookTab.values, meta: t.bookTab.valuesMeta },
    { id: 'goals', title: t.bookTab.goals, meta: t.bookTab.goalsMeta },
    {
      id: 'milestones',
      title: t.bookTab.milestones,
      meta: t.bookTab.milestonesMeta(done, ms.length),
      bar: { done, total: ms.length },
    },
    {
      id: 'tasks',
      title: t.bookTab.tasks,
      meta: t.bookTab.tasksMeta(
        `${shortDate(t, week)} – ${shortDate(t, addDays(week, 6))}`,
        tasks.length,
      ),
    },
    { id: 'sessions', title: t.bookTab.sessions, meta: t.bookTab.sessionsMeta },
    { id: 'antiGoal', title: t.bookTab.antiGoal, meta: t.bookTab.antiGoalMeta },
    {
      id: 'sacrifice',
      title: t.bookTab.sacrifice,
      meta: t.bookTab.sacrificeMeta,
    },
  ];

  return (
    <SheetPage
      testID="action-book"
      eyebrow={t.bookTab.eyebrow}
      title={t.bookTab.title}
      subtitle={t.bookTab.sub}
      bottomInset={TAB_BAR_CLEARANCE}
    >
      <View style={styles.thread} />
      {rows.map((r, i) => (
        <Animated.View
          key={r.id}
          entering={FadeInDown.delay(i * motion.stagger)
            .duration(motion.base)
            .easing(motion.easeOut)}
          style={styles.item}
        >
          <View style={styles.knot} />
          <Pressable
            testID={`book-${r.id}`}
            accessibilityRole="button"
            onPress={() => {
              haptics.tap();
              onOpen(r.id);
            }}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={styles.titleRow}>
              <AppText variant="heading" style={styles.title}>
                {r.title}
              </AppText>
              <ChevronRight
                width={16}
                height={16}
                color={colors.ink}
                strokeWidth={2}
              />
            </View>
            <AppText variant="label" style={styles.meta}>
              {r.meta}
            </AppText>
            {r.bar && r.bar.total ? (
              <View style={styles.segments}>
                {Array.from({ length: r.bar.total }, (_, k) => (
                  <View
                    key={k}
                    style={[
                      styles.segment,
                      {
                        backgroundColor:
                          k < r.bar!.done ? colors.saffron : colors.saffronLine,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </Pressable>
        </Animated.View>
      ))}
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  thread: {
    position: 'absolute',
    left: spacing.xl + 6,
    top: 40,
    bottom: 60,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderLeftColor: colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  knot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.parchment,
    marginLeft: 2,
  },
  card: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.parchment,
  },
  pressed: {
    backgroundColor: colors.white,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
  },
  meta: {
    color: colors.ink,
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
});
