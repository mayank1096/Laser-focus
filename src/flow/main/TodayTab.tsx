import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import { MilestoneList } from '../components/MilestoneList';
import { ShaderView } from '../../components/shader';
import { GradientPill } from '../../components/GradientPill';
import { rise } from '../../components/QuestionHeader';
import { TAB_BAR_CLEARANCE } from '../../components/TabBar';
import { Ticker } from '../../components/Ticker';
import { appDay, appMinutes } from '../../core/days';
import {
  activeMilestones,
  dayMark,
  homeAction,
  sprintProgress,
  type HomeAction,
} from '../../core/home';
import type { Mark } from '../../core/model';
import { useBook } from '../../core/store';
import { useT, type Strings } from '../../i18n';
import { clock, dayDate, shortDate } from '../../i18n/format';
import type { RootStackParamList } from '../../navigation/types';
import {
  colors,
  fonts,
  motion,
  spacing,
  typography,
  SILK,
  SMALL_TEXT,
} from '../../theme';
import { addDays } from '../../utils/date';
import { haptics } from '../../utils/haptics';

/** Squares in the journey grid: three rows of nineteen. */
const PER_ROW = 19;
const ROWS = 3;
/** Where the stone panel cuts the sky. */
const GLOW_HEIGHT = 462;
const DESIGN_WIDTH = 402;

/** The hero's silk, melting into the stone page. */
const SKY = [...SILK, '#F7F5F4'];

const WHITE_80 = 'rgba(255, 255, 255, 0.8)';
const WHITE_22 = 'rgba(255, 255, 255, 0.22)';
const INK_50 = 'rgba(0, 0, 0, 0.5)';
const INK_06 = 'rgba(0, 0, 0, 0.06)';

/**
 * The first landing after setup, in ms from the moment Home appears: the
 * sky dawns, the reminder drops on its strings, the goal rises, the days
 * light up one by one, then the card and the tab bar come up to meet you.
 */
export const ARRIVE = {
  strings: 300,
  reminder: 480,
  goal: 700,
  stats: 860,
  squares: 960,
  card: 1500,
  list: 1700,
  dock: 1800,
};

/** The sky settles down from above as it brightens. */
const dawn = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -90 }, { scale: 1.08 }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: motion.easeOut,
  },
}).duration(1100);

/** The reminder drops on its strings and swings to rest. */
const drop = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -36 }, { rotate: '-5deg' }] },
  45: { opacity: 1, transform: [{ translateY: 4 }, { rotate: '3deg' }] },
  70: { transform: [{ translateY: -1 }, { rotate: '-1.5deg' }] },
  100: { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
})
  .delay(ARRIVE.reminder)
  .duration(900);

const lift = (delay: number) =>
  FadeInDown.delay(delay).duration(motion.slow).easing(motion.easeOut);

/** The card comes up from further below, on a soft spring. */
const rise3 = (delay: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 70 }, { scale: 0.96 }] },
    100: {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
      easing: motion.easeOut,
    },
  })
    .delay(delay)
    .duration(700);

type Go = <K extends keyof RootStackParamList>(
  name: K,
  params?: RootStackParamList[K],
) => void;

/**
 * Today. The goal sits in the warm glow with every day of the run beneath
 * it; the one next step waits in the card; the milestones below show where
 * this week fits.
 */
export function TodayTab({ go, arrive = false }: { go: Go; arrive?: boolean }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const state = useBook();
  const today = appDay();
  const action = homeAction(state, today, appMinutes());
  const p = sprintProgress(state, today);
  const allMilestones = activeMilestones(state);
  // Like the design: the list starts at the milestone being worked on;
  // finished ones live on the Milestones sheet.
  const milestones = allMilestones.some(m => !m.done)
    ? allMilestones.filter(m => !m.done)
    : allMilestones;

  // A user back after days away is asked about the latest day only.
  useEffect(() => {
    useBook.getState().settlePending(today);
  }, [today]);

  // A different value each day, so the reminder never goes stale.
  const values = state.values.filter(v => v.text.trim());
  const value = values.length ? values[p.day % values.length].text : null;

  // The journey grid: one square per day, in windows of 57 days.
  const windowStart =
    Math.floor((p.day - 1) / (PER_ROW * ROWS)) * PER_ROW * ROWS;
  const squares = Array.from({ length: PER_ROW * ROWS }, (_, i) => {
    const d = addDays(p.start, windowStart + i);
    return d > today ? null : dayMark(state, d);
  });

  const card = describe(action, t, today, go);

  // On arrival the milestone bar fills from empty.
  const share = p.milestonesTotal ? p.milestonesDone / p.milestonesTotal : 0;
  const fill = useSharedValue(arrive ? 0 : share);
  useEffect(() => {
    fill.value = arrive
      ? withDelay(
          ARRIVE.stats + 200,
          withTiming(share, { duration: 900, easing: motion.easeOut }),
        )
      : share;
  }, [arrive, share, fill]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
  }));

  return (
    <View style={styles.screen} testID="home">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={arrive ? dawn : undefined}
          style={[styles.glow, { height: GLOW_HEIGHT * scale }]}
          pointerEvents="none"
        >
          <ShaderView
            preset="silk"
            width={width}
            height={GLOW_HEIGHT * scale}
            colours={SKY}
            style={styles.aurora}
          />
        </Animated.View>

        <View style={[styles.hero, { paddingTop: insets.top + 6 }]}>
          {/* The reminder hangs from two dashed strings. */}
          <Animated.View
            entering={
              arrive
                ? FadeInUp.delay(ARRIVE.strings).duration(motion.slow)
                : undefined
            }
            style={styles.strings}
            pointerEvents="none"
          >
            <Svg width="100%" height={insets.top + 6}>
              {['9.5%', '90.5%'].map(x => (
                <Line
                  key={x}
                  x1={x}
                  x2={x}
                  y1={0}
                  y2={insets.top + 6}
                  stroke={colors.white}
                  strokeDasharray="3 3"
                />
              ))}
            </Svg>
          </Animated.View>
          {value ? (
            <Animated.View
              entering={arrive ? drop : rise(0)}
              style={styles.reminder}
            >
              <GradientPill radius={10}>
                <Ticker
                  text={t.today.remember(value)}
                  style={styles.reminderText}
                />
              </GradientPill>
            </Animated.View>
          ) : null}

          <Animated.View
            entering={arrive ? lift(ARRIVE.goal) : rise(1)}
            style={styles.goalBlock}
          >
            <AppText style={styles.eyebrow}>{t.today.goal}</AppText>
            <AppText style={styles.goal} accessibilityRole="header">
              {p.goal?.text ?? ''}
            </AppText>
          </Animated.View>

          <Animated.View
            entering={arrive ? FadeIn.delay(ARRIVE.stats) : rise(2)}
            style={styles.stats}
          >
            <View style={styles.statsRow}>
              <AppText style={styles.micro}>
                {t.today.milestones(p.milestonesDone, p.milestonesTotal)}
              </AppText>
              <View style={styles.chip}>
                <AppText style={styles.micro}>
                  {t.today.left(p.monthsLeft, p.daysLeft)}
                </AppText>
              </View>
            </View>
            <View style={styles.bar}>
              <Animated.View style={[styles.barFill, fillStyle]} />
            </View>
            <Pressable
              testID="home-week"
              accessibilityRole="button"
              onPress={() => go('Book')}
              style={styles.grid}
            >
              {Array.from({ length: ROWS }, (_, r) => (
                <View key={r} style={styles.gridRow}>
                  {squares
                    .slice(r * PER_ROW, (r + 1) * PER_ROW)
                    .map((mark, i) => (
                      <DaySquare
                        key={i}
                        mark={mark}
                        // A wave across the run, left to right.
                        delay={arrive ? ARRIVE.squares + i * 22 + r * 50 : null}
                      />
                    ))}
                </View>
              ))}
            </Pressable>
          </Animated.View>
        </View>

        <Animated.View
          key={action.kind}
          entering={arrive ? rise3(ARRIVE.card) : rise(3)}
          style={styles.card}
        >
          <View style={styles.cardText}>
            <AppText style={styles.cardTitle}>{card.title}</AppText>
            {card.body ? (
              <AppText style={styles.cardBody}>{card.body}</AppText>
            ) : null}
          </View>
          {card.button ? (
            <Pressable
              testID="home-action"
              accessibilityRole="button"
              accessibilityLabel={card.button.label}
              onPress={() => {
                haptics.confirm();
                card.button!.go();
              }}
              style={({ pressed }) => [styles.start, pressed && styles.pressed]}
            >
              <AppText style={styles.startLabel} numberOfLines={1}>
                {card.button.label}
              </AppText>
              {card.button.meta ? (
                <AppText style={styles.startMeta}>{card.button.meta}</AppText>
              ) : null}
            </Pressable>
          ) : null}
          {card.extra ? (
            <Pressable
              testID="home-extra"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                haptics.tap();
                card.extra!.go();
              }}
              style={styles.extra}
            >
              <AppText style={styles.extraText}>{card.extra.label}</AppText>
            </Pressable>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={
            arrive ? FadeIn.delay(ARRIVE.list).duration(motion.slow) : undefined
          }
        >
          <MilestoneList
            milestones={milestones}
            testIDPrefix="today-ms"
            style={styles.milestones}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

interface Card {
  title: string;
  body?: string;
  button?: { label: string; meta?: string; go: () => void };
  extra?: { label: string; go: () => void };
}

/** The card for each step of the loop: what it is, and the one button. */
function describe(a: HomeAction, t: Strings, today: string, go: Go): Card {
  switch (a.kind) {
    case 'setup': {
      const label = t.home.continueSetup(t.home.setupSheets[a.step]);
      const target =
        a.step === 'vow'
          ? () => go('Pratigya')
          : a.step === 'plan'
          ? () => go('Plan', { first: true })
          : () => go('Setup', { step: a.step });
      return { title: t.today.setupTitle, button: { label, go: target } };
    }
    case 'resting':
      return {
        title: t.today.restTitle,
        body: `${t.home.restingUntil(shortDate(t, a.until))}. ${
          t.today.restBody
        }`,
        extra: {
          label: t.home.endRest,
          go: () => {
            useBook.getState().endRest();
            go('Reassess');
          },
        },
      };
    case 'reassess':
      return {
        title: t.today.reassessTitle,
        body: t.today.reassessBody,
        button: { label: t.home.reassess, go: () => go('Reassess') },
      };
    case 'inProgress':
      return {
        title: t.today.progressTitle,
        body: a.session.what,
        button: {
          label: t.home.inProgress(a.session.order + 1),
          go: () => go('InProgress', { id: a.session.id }),
        },
      };
    case 'markPast':
      return {
        title: t.today.markTitle,
        body: a.session.what,
        button: {
          label: t.home.markPast(
            a.session.date === addDays(today, -1)
              ? t.home.yesterday
              : dayDate(t, a.session.date),
            a.session.order + 1,
          ),
          go: () => go('Mark', { id: a.session.id }),
        },
      };
    case 'finishGoal':
      return {
        title: t.today.goalTitle,
        body: t.today.goalBody,
        button: { label: t.home.finishGoal, go: () => go('GoalDone') },
      };
    case 'review':
      return {
        title: t.today.reviewTitle,
        body: t.today.reviewBody,
        button: {
          label: t.home.review,
          go: () => go('Review', { week: a.week }),
        },
        extra: { label: t.home.planFirst, go: () => go('Plan') },
      };
    case 'reread':
      return {
        title: t.today.rereadTitle,
        body: t.today.rereadBody,
        button: {
          label: t.home.reread,
          go: () => go('Setup', { returnTo: 'reread' }),
        },
      };
    case 'start':
      return {
        title: a.session.what,
        body: a.session.outcome,
        button: {
          label: t.today.start(a.index + 1),
          meta: t.today.startMeta(
            clock(t, a.session.start),
            t.common.minutes(a.session.minutes),
          ),
          go: () => go('Start', { id: a.session.id }),
        },
        extra: {
          label: t.home.editPlan,
          go: () => go('Plan', { date: today }),
        },
      };
    case 'tomorrow':
      return {
        title: t.today.tomorrowTitle,
        body: t.today.tomorrowBody(a.session.what, clock(t, a.session.start)),
        extra: {
          label: t.home.editPlan,
          go: () => go('Plan', { date: a.session.date }),
        },
      };
    case 'plan':
      return {
        title: t.today.planTitle,
        body: t.today.planBody,
        button: {
          label: a.date === today ? t.home.planToday : t.home.planTomorrow,
          go: () => go('Plan', { date: a.date }),
        },
      };
  }
}

/** Full: solid. Half: filled half way up. Empty or not yet: faint. */
function DaySquare({
  mark,
  delay,
}: {
  mark: Mark | null;
  /** On arrival, when this square pops in. */
  delay: number | null;
}) {
  return (
    <Animated.View
      entering={
        delay === null
          ? undefined
          : ZoomIn.delay(delay).springify().damping(14).stiffness(260)
      }
      style={styles.square}
    >
      {mark === 'full' ? <View style={styles.squareFull} /> : null}
      {mark === 'half' ? <View style={styles.squareHalf} /> : null}
    </Animated.View>
  );
}

const sans = (size: number, weight: 'regular' | 'medium' | 'bold') => ({
  // Small text is never heavier than regular.
  fontFamily:
    size <= SMALL_TEXT
      ? fonts.sans
      : weight === 'bold'
      ? fonts.sansBold
      : weight === 'medium'
      ? fonts.sansMedium
      : fonts.sans,
  fontSize: size,
  lineHeight: size * 1.3,
  // Small text gets a little air; larger text stays tight.
  letterSpacing: size <= 13 ? size * 0.02 : size * -0.02,
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.stone,
  },
  aurora: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  hero: {
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  strings: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  reminder: {
    alignSelf: 'stretch',
  },
  reminderText: {
    ...sans(13, 'medium'),
    color: colors.ink,
    textAlign: 'center',
  },
  goalBlock: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  eyebrow: {
    ...sans(11, 'medium'),
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: WHITE_80,
  },
  goal: {
    ...typography.title,
    fontSize: 29,
    lineHeight: 32,
    letterSpacing: -0.58,
    color: colors.white,
    textAlign: 'center',
  },
  stats: {
    alignSelf: 'stretch',
    marginTop: 18,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  micro: {
    ...sans(12, 'medium'),
    color: WHITE_80,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: WHITE_22,
  },
  bar: {
    height: 4,
    borderRadius: 99,
    backgroundColor: WHITE_22,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.white,
  },
  grid: {
    marginTop: 4,
    gap: 5,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  square: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: WHITE_22,
    overflow: 'hidden',
  },
  squareFull: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.white,
  },
  // Half a day: the box filled half way up.
  squareHalf: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 7,
    backgroundColor: colors.white,
  },
  card: {
    marginTop: 28,
    marginHorizontal: 22,
    padding: 16,
    gap: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: INK_06,
    backgroundColor: colors.stone,
    boxShadow: '0px 24px 18px rgba(0, 0, 0, 0.08)',
  },
  cardText: {
    gap: 10,
  },
  cardTitle: {
    ...typography.heading,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.32,
    color: colors.ink,
  },
  cardBody: {
    ...sans(13, 'regular'),
    color: INK_50,
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.charcoal,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  startLabel: {
    ...typography.button,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.32,
    color: colors.white,
  },
  startMeta: {
    ...sans(12, 'medium'),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  extra: {
    alignSelf: 'center',
    marginTop: -6,
  },
  extraText: {
    ...sans(13, 'medium'),
    color: INK_50,
  },
  milestones: {
    marginTop: 28,
    marginHorizontal: 22,
  },
});
