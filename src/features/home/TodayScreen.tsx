import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line } from 'react-native-svg';
import { art } from '../../assets/art';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { AppText } from '../../components/AppText';
import { GradientPill } from '../../components/GradientPill';
import { rise } from '../../components/QuestionHeader';
import { TAB_BAR_CLEARANCE } from '../../components/TabBar';
import type { Id, Priority } from '../../types/models';
import { colors, fonts, motion, spacing, typography } from '../../theme';
import { today as todayISO } from '../../utils/clock';
import { addDays, formatClock } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { useGoalSetup } from '../onboarding/store';
import {
  isTaskDone,
  planFor,
  tasksForWeek,
  usePlanning,
} from '../planning/store';
import { useGoalProgress, useMilestoneRows } from '../progress';
import { dayMark, useSessions, type DayMark } from '../session/store';

/** Squares in the journey grid: three rows of nineteen. */
const PER_ROW = 19;
const ROWS = 3;
/** Where Figma's stone panel cuts the glow, and the glow art's height. */
const GLOW_HEIGHT = 462;
const GLOW_ART_HEIGHT = 801;
const DESIGN_WIDTH = 402;

const WHITE_80 = 'rgba(255, 255, 255, 0.8)';
const WHITE_22 = 'rgba(255, 255, 255, 0.22)';
const INK_50 = 'rgba(0, 0, 0, 0.5)';
const INK_06 = 'rgba(0, 0, 0, 0.06)';

export interface TodayActions {
  onBegin: (slotId: Id) => void;
  onPlanToday: () => void;
}

/** "5 months, 21 days left" from today to the deadline. */
function timeLeft(days: number): string {
  if (days <= 0) {
    return 'Deadline reached';
  }
  const months = Math.floor(days / 30.4);
  const rest = Math.round(days - months * 30.4);
  const parts = [
    months ? `${months} ${months === 1 ? 'month' : 'months'}` : '',
    rest ? `${rest} ${rest === 1 ? 'day' : 'days'}` : '',
  ].filter(Boolean);
  return `${parts.join(', ')} left`;
}

/**
 * Today (Figma 2.01 Home). The goal sits in the warm glow with every day of
 * the journey beneath it; the next session waits in the card; the milestones
 * below show where this week fits.
 */
export function TodayScreen({ onBegin, onPlanToday }: TodayActions) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  const date = todayISO();
  const g = useGoalSetup();
  const planning = usePlanning();
  const sessions = useSessions();
  const progress = useGoalProgress();
  const { rows, current } = useMilestoneRows();
  const [open, setOpen] = useState(current === -1 ? 0 : current);

  // A different value each day, so the reminder never goes stale.
  const value = g.values.length
    ? g.values[progress.day % g.values.length].text
    : null;

  // The journey grid: one square per day, in windows of 57 days.
  const start = addDays(date, -(progress.day - 1));
  const windowStart =
    Math.floor((progress.day - 1) / (PER_ROW * ROWS)) * PER_ROW * ROWS;
  const squares: DayMark[] = Array.from({ length: PER_ROW * ROWS }, (_, i) => {
    const d = addDays(start, windowStart + i);
    return d > date ? 'empty' : dayMark(sessions, planning, d, date);
  });

  const day = planFor(planning, date);
  const results = sessions.results[date] ?? {};
  const planned = day.sessions.filter(s => s.task);
  const next = planned.find(s => !results[s.slot.id]);
  const week = tasksForWeek(planning, date).filter(t => t.kind === 'deep');

  const deadlineDays = Math.max(0, progress.days - progress.day + 1);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Figma's blurred saffron ellipse, exported 1:1; the stone panel
            cuts it at y 445 just as the frame does. */}
        <View
          style={[styles.glow, { height: GLOW_HEIGHT * scale }]}
          pointerEvents="none"
        >
          <MovingGlow width={width} height={GLOW_ART_HEIGHT * scale} />
        </View>

        <View style={[styles.hero, { paddingTop: insets.top + 6 }]}>
          {/* The reminder hangs from two dashed strings. */}
          <Svg
            style={styles.strings}
            width="100%"
            height={insets.top + 6}
            pointerEvents="none"
          >
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
          {value ? (
            <Animated.View entering={rise(0)} style={styles.reminder}>
              <GradientPill radius={10}>
                <AppText style={styles.reminderText} numberOfLines={2}>
                  {`Remember you said: “${value}”`}
                </AppText>
              </GradientPill>
            </Animated.View>
          ) : null}

          <Animated.View entering={rise(1)} style={styles.goalBlock}>
            <AppText style={styles.eyebrow}>Your first goal</AppText>
            <AppText style={styles.goal} accessibilityRole="header">
              {progress.goal}
            </AppText>
          </Animated.View>

          <Animated.View entering={rise(2)} style={styles.stats}>
            <View style={styles.statsRow}>
              <AppText style={styles.micro}>
                {`${progress.done}/${progress.total} ${progress.noun}`}
              </AppText>
              <View style={styles.chip}>
                <AppText style={styles.micro}>{timeLeft(deadlineDays)}</AppText>
              </View>
            </View>
            <View style={styles.bar}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(
                      100,
                      (progress.done / progress.total) * 100,
                    )}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.grid} testID="today-grid">
              {Array.from({ length: ROWS }, (_, r) => (
                <View key={r} style={styles.gridRow}>
                  {squares
                    .slice(r * PER_ROW, (r + 1) * PER_ROW)
                    .map((mark, i) => (
                      <DaySquare key={i} mark={mark} />
                    ))}
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={rise(3)} style={styles.card}>
          {next ? (
            <>
              <View style={styles.cardText}>
                <View style={styles.cardHead}>
                  <PriorityDots priority={next.task?.priority ?? 2} />
                  <AppText style={styles.cardTitle}>
                    {next.task?.text ?? 'Deep work'}
                  </AppText>
                </View>
                <AppText style={styles.cardBody}>
                  {next.sheet
                    ? next.sheet.outcome
                    : 'No sheet yet · two minutes to write one before you start.'}
                </AppText>
              </View>
              <Pressable
                testID={`today-begin-${next.slot.id}`}
                accessibilityRole="button"
                accessibilityLabel="Start session"
                onPress={() => {
                  haptics.confirm();
                  onBegin(next.slot.id);
                }}
                style={({ pressed }) => [
                  styles.start,
                  pressed && styles.pressed,
                ]}
              >
                <AppText style={styles.startLabel}>Start Session</AppText>
                <AppText style={styles.startMeta}>
                  {`${formatClock(next.slot.start)} · ${
                    next.sheet?.minutes ?? next.slot.minutes
                  } mins`}
                </AppText>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.cardText}>
                <AppText style={styles.cardTitle}>
                  {planned.length ? 'Every arrow has flown.' : 'An open day.'}
                </AppText>
                <AppText style={styles.cardBody}>
                  {planned.length
                    ? 'Rest now. Tomorrow is planned from the Tasks tab.'
                    : 'Nothing is planned for today. Give today one session.'}
                </AppText>
              </View>
              {planned.length ? null : (
                <Pressable
                  testID="today-plan"
                  accessibilityRole="button"
                  onPress={onPlanToday}
                  style={({ pressed }) => [
                    styles.start,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.startLabel}>Plan today</AppText>
                </Pressable>
              )}
            </>
          )}
        </Animated.View>

        <View style={styles.milestones}>
          {rows.map((row, i) => {
            const expanded = i === open;
            const isCurrent = i === current;
            return (
              <Animated.View
                key={row.id}
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
                  style={styles.milestoneHead}
                >
                  <ChevronDown
                    width={18}
                    height={18}
                    strokeWidth={2}
                    color={isCurrent ? colors.ink : INK_50}
                    style={{
                      transform: [{ rotate: expanded ? '0deg' : '-90deg' }],
                    }}
                  />
                  <AppText
                    style={[
                      styles.milestoneName,
                      isCurrent ? styles.bold : styles.dim,
                    ]}
                    numberOfLines={1}
                  >
                    {row.text}
                  </AppText>
                  <AppText
                    style={[styles.count, isCurrent && styles.saffronText]}
                  >
                    {`${row.done}/${row.size}`}
                  </AppText>
                </Pressable>
                <View style={[styles.track, isCurrent && styles.trackCurrent]}>
                  {isCurrent ? (
                    <View
                      style={[
                        styles.trackFill,
                        { width: `${(row.done / row.size) * 100}%` },
                      ]}
                    />
                  ) : null}
                </View>
                {expanded && isCurrent && week.length ? (
                  <Animated.View
                    entering={FadeIn.duration(motion.base)}
                    style={styles.week}
                  >
                    <Svg width={1} height="100%" style={styles.weekThread}>
                      <Line
                        x1={0.5}
                        x2={0.5}
                        y1={0}
                        y2="100%"
                        stroke="rgba(0, 0, 0, 0.1)"
                        strokeDasharray="4 4"
                      />
                    </Svg>
                    <View style={styles.weekList}>
                      <AppText style={styles.weekEyebrow}>This week</AppText>
                      {week.map((t, ti) => {
                        const done = isTaskDone(t);
                        const active =
                          !done && ti === week.findIndex(w => !isTaskDone(w));
                        return (
                          <View key={t.id} style={styles.weekRow}>
                            <Svg width={14} height={14}>
                              <Circle
                                cx={7}
                                cy={7}
                                r={6.25}
                                stroke={
                                  done || active
                                    ? colors.saffron
                                    : 'rgba(0, 0, 0, 0.2)'
                                }
                                strokeWidth={1.5}
                                fill={done ? colors.saffron : 'none'}
                              />
                            </Svg>
                            <AppText
                              style={[
                                styles.weekTask,
                                active ? styles.bold12 : styles.dim12,
                              ]}
                              numberOfLines={1}
                            >
                              {t.text}
                            </AppText>
                          </View>
                        );
                      })}
                    </View>
                  </Animated.View>
                ) : null}
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

/** Full mark: solid. Half mark: half filled. Missed or ahead: faint. */
function DaySquare({ mark }: { mark: DayMark }) {
  return (
    <View style={styles.square}>
      {mark === 'full' ? <View style={styles.squareFull} /> : null}
      {mark === 'half' ? <View style={styles.squareHalf} /> : null}
    </View>
  );
}

function PriorityDots({ priority }: { priority: Priority }) {
  return (
    <View style={styles.dots}>
      {[1, 2, 3].map(n => (
        <View key={n} style={[styles.dot, n > priority && styles.dotOff]} />
      ))}
    </View>
  );
}

const sans = (size: number, weight: 'regular' | 'medium' | 'bold') => ({
  fontFamily:
    weight === 'bold'
      ? fonts.sansBold
      : weight === 'medium'
      ? fonts.sansMedium
      : fonts.sans,
  fontSize: size,
  lineHeight: size * 1.3,
  letterSpacing: size * -0.02,
});

/**
 * The glow drifts: it sways side to side and breathes on two different
 * clocks, so the light never visibly repeats. Always a little enlarged so
 * no edge ever shows.
 */
function MovingGlow({ width, height }: { width: number; height: number }) {
  // One slow clock; the sway and the breath ride it at different rates.
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [t]);
  const style = useAnimatedStyle(() => {
    const sway = Math.sin(t.value * Math.PI * 2);
    const breath = Math.sin(t.value * Math.PI * 6);
    return {
      transform: [
        { translateX: sway * width * 0.04 },
        { translateY: breath * height * 0.015 },
        { scale: 1.13 + breath * 0.03 },
      ],
      opacity: 0.94 + breath * 0.06,
    };
  });
  return (
    <Animated.Image
      source={art.homeGlow}
      style={[{ width, height }, style]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.stone,
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
  squareHalf: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 7,
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
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    ...typography.heading,
    flex: 1,
    fontSize: 16,
    lineHeight: 17.6,
    letterSpacing: -0.32,
    color: colors.ink,
  },
  cardBody: {
    ...sans(13, 'medium'),
    color: INK_50,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.saffron,
  },
  dotOff: {
    opacity: 0.25,
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 16,
    lineHeight: 17.6,
    letterSpacing: -0.32,
    color: colors.white,
  },
  startMeta: {
    ...sans(12, 'medium'),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  milestones: {
    marginTop: 28,
    marginHorizontal: 22,
    gap: 24,
  },
  milestone: {
    gap: 10,
  },
  milestoneHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  milestoneName: {
    flex: 1,
  },
  bold: {
    ...sans(14, 'bold'),
    color: colors.ink,
  },
  dim: {
    ...sans(14, 'medium'),
    color: INK_50,
  },
  count: {
    ...sans(14, 'bold'),
    color: colors.ink,
  },
  saffronText: {
    color: colors.saffron,
  },
  track: {
    height: 3,
    borderRadius: 999,
    backgroundColor: INK_06,
    overflow: 'hidden',
  },
  trackCurrent: {
    backgroundColor: 'rgba(250, 140, 34, 0.2)',
  },
  trackFill: {
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.saffron,
  },
  week: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 10,
    marginTop: 6,
  },
  weekThread: {
    alignSelf: 'stretch',
  },
  weekList: {
    flex: 1,
    gap: 18,
    paddingBottom: spacing.xs,
  },
  weekEyebrow: {
    ...sans(11, 'medium'),
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: INK_50,
    marginBottom: -4,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekTask: {
    flex: 1,
  },
  bold12: {
    ...sans(13, 'bold'),
    color: colors.ink,
  },
  dim12: {
    ...sans(13, 'medium'),
    color: INK_50,
  },
});
