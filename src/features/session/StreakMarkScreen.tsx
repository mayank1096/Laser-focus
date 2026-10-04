import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { today as todayISO } from '../../utils/clock';
import {
  addDays,
  formatClock,
  fromISODate,
  startOfWeek,
} from '../../utils/date';
import { planFor, usePlanning } from '../planning/store';
import { useStreak } from '../progress';
import { DayMarkIcon } from './components/DayMarkIcon';
import { dayMark, useSessions } from './store';

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakMarkScreen({
  navigation,
  route,
}: RootScreenProps<'StreakMark'>) {
  const { date } = route.params;
  const insets = useSafeAreaInsets();
  const sessions = useSessions();
  const planning = usePlanning();
  const streak = useStreak();
  const today = todayISO();
  const mark = dayMark(sessions, planning, date, today);
  const monday = startOfWeek(date);
  const next = planFor(planning, date).sessions.find(
    s => s.task && !sessions.results[date]?.[s.slot.id],
  );

  const copy =
    mark === 'full'
      ? { title: 'Full mark.', sub: 'One arrow closer to the eye.' }
      : mark === 'half'
      ? { title: 'Half mark.', sub: 'You showed up. The streak holds.' }
      : next
      ? { title: 'Not yet.', sub: 'One more arrow today. It still counts.' }
      : {
          title: 'No mark today.',
          sub: 'Tomorrow, sit ten minutes at least. That is the floor.',
        };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 40 }]}>
      <Animated.View
        entering={ZoomIn.delay(200).duration(motion.slow)}
        style={styles.glow}
      >
        <DayMarkIcon mark={mark === 'pending' ? 'empty' : mark} size={64} />
      </Animated.View>
      <Animated.Text
        entering={rise(1)}
        style={[typography.eyebrow, styles.center]}
      >
        {`Day ${streak}`}
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={[styles.title, styles.center]}>
        {copy.title}
      </Animated.Text>
      <Animated.Text
        entering={rise(3)}
        style={[typography.body, styles.center, styles.muted]}
      >
        {copy.sub}
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(400).duration(motion.slow)}
        style={styles.week}
      >
        <AppText variant="eyebrow">This week</AppText>
        <View style={styles.days}>
          {LETTERS.map((l, i) => {
            const d = addDays(monday, i);
            const m =
              d > today ? 'empty' : dayMark(sessions, planning, d, today);
            const isToday = d === date;
            return (
              <View key={d} style={styles.day}>
                <View style={isToday ? styles.todayRing : null}>
                  <DayMarkIcon mark={m === 'pending' ? 'empty' : m} />
                </View>
                <AppText variant="micro" style={isToday ? null : styles.muted}>
                  {l}
                </AppText>
              </View>
            );
          })}
        </View>
        <AppText variant="micro" style={styles.muted}>
          Filled: full mark · Wave: half mark, showed up 10 min+
        </AppText>
      </Animated.View>

      {next ? (
        <Animated.View
          entering={FadeInDown.delay(550).duration(motion.slow)}
          style={styles.next}
        >
          <AppText variant="eyebrow">{`Next · ${formatClock(
            next.slot.start,
          )}`}</AppText>
          <AppText variant="bodyMedium">{next.task?.text}</AppText>
        </Animated.View>
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 40 }]}>
        <PrimaryButton
          testID="next-button"
          label="Done"
          onPress={() =>
            next || fromISODate(date) < fromISODate(today)
              ? navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main', params: { tab: 'today' } }],
                })
              : navigation.reset({ index: 0, routes: [{ name: 'Rest' }] })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
    paddingHorizontal: spacing.gutter,
  },
  glow: {
    alignSelf: 'center',
    marginBottom: spacing.xxl,
    borderRadius: 40,
    boxShadow: '0px 0px 40px rgba(250, 140, 34, 0.55)',
  },
  center: {
    textAlign: 'center',
  },
  title: {
    ...typography.display,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
  week: {
    marginTop: 36,
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  todayRing: {
    borderRadius: 14,
    boxShadow: '0px 0px 10px rgba(250, 140, 34, 0.6)',
  },
  next: {
    marginTop: spacing.xl,
    gap: spacing.xs,
    padding: spacing.xl,
    borderRadius: 12,
    backgroundColor: colors.stone,
  },
  footer: {
    marginTop: 'auto',
  },
});
