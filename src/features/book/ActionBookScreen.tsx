import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ChevronRight from '../../assets/icons/chevron-right.svg';
import { AppText } from '../../components/AppText';
import { TAB_BAR_CLEARANCE } from '../../components/TabBar';
import { colors, motion, spacing } from '../../theme';
import { today } from '../../utils/clock';
import { formatWeekRange, startOfWeek } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { useGoalSetup } from '../onboarding/store';
import { tasksForWeek, usePlanning } from '../planning/store';
import { useGoalProgress } from '../progress';
import { SheetPage } from './components/SheetPage';

export type BookDestination =
  | 'values'
  | 'goals'
  | 'milestones'
  | 'tasks'
  | 'sessions'
  | 'antiGoals'
  | 'sacrifice';

/**
 * The six sheets, in the order the course builds them: from once in a
 * lifetime down to every night. A thread on the left ties them together.
 */
export function ActionBookScreen({
  onOpen,
}: {
  onOpen: (sheet: BookDestination) => void;
}) {
  const g = useGoalSetup();
  const planning = usePlanning();
  const progress = useGoalProgress();
  const day = today();
  const tasks = tasksForWeek(planning, day);
  const current = Math.min(
    g.milestones.length,
    Math.floor((progress.done / progress.total) * g.milestones.length) + 1,
  );

  const rows: {
    id: BookDestination;
    title: string;
    meta: string;
    bar?: { done: number; total: number };
  }[] = [
    { id: 'values', title: 'Values', meta: 'Once in a lifetime' },
    { id: 'goals', title: 'Goals', meta: 'Once every few years' },
    {
      id: 'milestones',
      title: 'Milestones',
      meta: `Every few months · ${String(current).padStart(2, '0')}/${String(
        g.milestones.length,
      ).padStart(2, '0')}`,
      bar: { done: current, total: g.milestones.length },
    },
    {
      id: 'tasks',
      title: 'Tasks',
      meta: `Every week · ${formatWeekRange(startOfWeek(day))} · ${
        tasks.length
      } tasks`,
    },
    { id: 'sessions', title: 'Sessions', meta: 'Every night' },
    {
      id: 'antiGoals',
      title: 'Anti-goals',
      meta: 'Read when you don’t feel like it',
    },
  ];
  if (planning.sacrifice) {
    rows.push({
      id: 'sacrifice',
      title: 'Sacrifice',
      meta: 'What goes, what stays',
    });
  }

  return (
    <SheetPage
      testID="action-book"
      eyebrow="Your sheets"
      title="Action Book"
      subtitle="Values › Goals › Milestones › Tasks › Sessions"
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
            {r.bar ? (
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
