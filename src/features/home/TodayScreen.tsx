import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import { rise } from '../../components/QuestionHeader';
import { TAB_BAR_CLEARANCE } from '../../components/TabBar';
import type { Id } from '../../types/models';
import { colors, spacing, typography } from '../../theme';
import { now as clockNow, today as todayISO } from '../../utils/clock';
import { clockOf, formatClock } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { useGoalSetup } from '../onboarding/store';
import { planFor, usePlanning } from '../planning/store';
import { useGoalProgress, useStreak } from '../progress';
import { isComplete, useSessions } from '../session/store';
import { GoalFlight } from './GoalFlight';
import { SunDial, type DialArc } from './SunDial';
import { sansDigits } from '../../components/Numerals';

const WORDS = ['No', 'One', 'Two', 'Three'];
const DATE = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/** "1 h 12", "45 min". */
function until(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

/** Re-render every minute so the hand and countdown stay true. */
function useMinute(): Date {
  const [t, setT] = useState(clockNow());
  useEffect(() => {
    const id = setInterval(() => setT(clockNow()), 30_000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export interface TodayActions {
  onBegin: (slotId: Id) => void;
  onPlanToday: () => void;
}

/**
 * Today, as a sun path. Everything on the screen answers one question:
 * what is the next arrow, and when does it leave?
 */
export function TodayScreen({ onBegin, onPlanToday }: TodayActions) {
  const insets = useSafeAreaInsets();
  const now = useMinute();
  const date = todayISO();
  const planning = usePlanning();
  const sessions = useSessions();
  const g = useGoalSetup();
  const progress = useGoalProgress();
  const streak = useStreak();
  const day = planFor(planning, date);
  const minutes = clockOf(now);

  const planned = day.sessions.filter(s => s.task);
  const results = sessions.results[date] ?? {};
  const flown = planned.filter(
    s => results[s.slot.id] && isComplete(results[s.slot.id]),
  );
  const next = planned.find(s => !results[s.slot.id]);

  const arcs: DialArc[] = planned.map(s => {
    const r = results[s.slot.id];
    const end = s.slot.start + (s.sheet?.minutes ?? s.slot.minutes);
    return {
      id: s.slot.id,
      from: s.slot.start / 60,
      to: end / 60,
      state: r
        ? isComplete(r)
          ? 'done'
          : 'half'
        : end < minutes
        ? 'missed'
        : 'ahead',
    };
  });

  const headline =
    planned.length === 0
      ? 'An open day.'
      : flown.length === planned.length
      ? 'Every arrow has flown.'
      : `${WORDS[planned.length] ?? planned.length} ${
          planned.length === 1 ? 'arrow' : 'arrows'
        } today.`;
  const sub = next
    ? `${
        flown.length
          ? `${WORDS[flown.length]} ${
              flown.length === 1 ? 'has' : 'have'
            } flown. `
          : ''
      }The next leaves at ${formatClock(next.slot.start)}.`
    : planned.length
    ? 'Rest now. You earned it.'
    : 'Nothing planned. Give today one arrow.';

  const wait = next ? next.slot.start - minutes : 0;
  const centre = !next
    ? planned.length
      ? 'Done'
      : '—'
    : wait > 0
    ? until(wait)
    : 'Now';
  const centreNote = !next
    ? planned.length
      ? 'for today'
      : 'no sessions planned'
    : wait > 0
    ? 'until the next arrow'
    : 'the arrow is waiting';

  const repeated = g.workShape === 'repeated';
  const notches = g.milestones
    .slice(0, -1)
    .map((_, i) => (i + 1) / g.milestones.length);

  return (
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
      <Animated.View entering={rise(0)} style={styles.top}>
        <AppText variant="label" style={styles.muted}>
          {DATE.format(now)}
        </AppText>
        <View
          style={styles.streak}
          accessibilityLabel={`Streak: ${streak} days`}
        >
          <View style={styles.streakDot} />
          <AppText variant="label">{`Day ${streak}`}</AppText>
        </View>
      </Animated.View>
      <Animated.Text
        entering={rise(1)}
        style={styles.headline}
        accessibilityRole="header"
      >
        {sansDigits(headline)}
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={[typography.body, styles.muted]}>
        {sub}
      </Animated.Text>

      <View style={styles.dial}>
        <SunDial
          size={300}
          arcs={arcs}
          now={minutes / 60}
          shallow={{
            from: planning.shallowWindow.start / 60,
            to: planning.shallowWindow.end / 60,
          }}
        >
          <AppText style={styles.centre} testID="today-countdown">
            {centre}
          </AppText>
          <AppText variant="micro" style={styles.muted}>
            {centreNote}
          </AppText>
        </SunDial>
      </View>

      <Animated.View entering={rise(4)}>
        {next ? (
          <Pressable
            testID={`today-begin-${next.slot.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Begin the ${formatClock(
              next.slot.start,
            )} session`}
            onPress={() => {
              haptics.confirm();
              onBegin(next.slot.id);
            }}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardText}>
              <AppText variant="eyebrow" style={styles.onDarkMuted}>
                {`Next · ${formatClock(next.slot.start)} · ${
                  next.sheet?.minutes ?? next.slot.minutes
                } min`}
              </AppText>
              <AppText style={styles.outcome}>
                {next.sheet?.outcome ?? next.task?.text}
              </AppText>
              {next.sheet?.challenge ? (
                <View style={styles.harder}>
                  <AppText variant="label" style={styles.saffron}>
                    Harder
                  </AppText>
                  <AppText
                    variant="label"
                    style={styles.onDarkMuted}
                    numberOfLines={1}
                  >
                    {next.sheet.challenge}
                  </AppText>
                </View>
              ) : (
                <AppText variant="label" style={styles.saffron}>
                  No sheet yet · two minutes
                </AppText>
              )}
            </View>
            <View style={styles.go}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke={colors.white}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </View>
          </Pressable>
        ) : (
          <Pressable
            testID="today-plan"
            accessibilityRole="button"
            onPress={onPlanToday}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.cardText}>
              <AppText variant="eyebrow" style={styles.onDarkMuted}>
                {planned.length ? 'Tomorrow' : 'Today'}
              </AppText>
              <AppText style={styles.outcome}>
                {planned.length
                  ? 'Plan tomorrow while it’s fresh.'
                  : 'Give today one arrow.'}
              </AppText>
            </View>
            <View style={styles.go}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M12 5v14M5 12h14"
                  stroke={colors.white}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>
          </Pressable>
        )}
      </Animated.View>

      <Animated.View entering={rise(5)} style={styles.flight}>
        <GoalFlight
          label={`${progress.goal}`}
          progress={progress.done / progress.total}
          notches={notches}
          left={`${progress.done} of ${progress.total} ${
            repeated ? progress.noun : 'steps'
          }`}
          right={`${progress.monthsLeft} months to the eye`}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    paddingHorizontal: spacing.gutter,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingLeft: 10,
    paddingRight: spacing.lg,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
  },
  streakDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.saffron,
  },
  headline: {
    ...typography.title,
    fontSize: 34,
    lineHeight: 38,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
  dial: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  centre: {
    ...typography.title,
    fontSize: 40,
    lineHeight: 44,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.xl + 4,
    paddingLeft: spacing.xl + 4,
    paddingRight: spacing.xl,
    borderRadius: 22,
    backgroundColor: colors.night,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
  },
  cardText: {
    flex: 1,
    gap: spacing.md,
  },
  outcome: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 23,
    color: colors.white,
  },
  harder: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saffron: {
    color: colors.saffron,
  },
  onDarkMuted: {
    color: 'rgba(255, 255, 255, 0.5)',
    flexShrink: 1,
  },
  go: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.saffron,
  },
  flight: {
    marginTop: spacing.xxl,
  },
});
