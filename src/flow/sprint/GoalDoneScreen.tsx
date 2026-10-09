import React, { useEffect } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Check from '../../assets/icons/check.svg';
import ChevronLeft from '../../assets/icons/chevron-left.svg';
import { AppText } from '../../components/AppText';
import { IconButton } from '../../components/IconButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { ShaderView } from '../../components/shader';
import { appDay } from '../../core/days';
import { activeMilestones, dayMark } from '../../core/home';
import type { Mark } from '../../core/model';
import { circledGoal, useBook } from '../../core/store';
import { useT } from '../../i18n';
import { shortDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, spacing, typography } from '../../theme';
import { addDays, daysBetween } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { countDays } from '../components/Calendar';

const HERO = 260;
const RINGS = [96, 72, 48];
const INK_50 = 'rgba(0, 0, 0, 0.5)';
const INK_06 = 'rgba(0, 0, 0, 0.06)';
/** Squares in the journey grid: big for a short run, small for years. */
const TILE_GAP = 4;
const tileFor = (days: number, room: number) =>
  Math.max(
    8,
    Math.min(22, Math.floor((room + TILE_GAP) / Math.min(days, 14)) - TILE_GAP),
  );

/**
 * A goal reached, or a sprint ended. The target glows at the top with the
 * goal beneath it; then the run in three numbers, the milestones as a
 * thread, and every day since the circle as a field of squares.
 */
export function GoalDoneScreen({ navigation }: RootScreenProps<'GoalDone'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const state = useBook();
  const goal = circledGoal(state);
  const today = appDay();
  const from = state.sprintStart ?? today;
  const { full, half } = countDays(state, from, today);
  const days = Math.max(1, daysBetween(from, today) + 1);
  const milestones = activeMilestones(state);
  const done = milestones.filter(m => m.done).length;
  const reached = milestones.length > 0 && done === milestones.length;
  const tile = tileFor(days, width - spacing.gutter * 2);
  const marks: (Mark | null)[] = Array.from({ length: days }, (_, i) =>
    dayMark(state, addDays(from, i)),
  );

  return (
    <View style={styles.screen} testID="goal-done">
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { height: HERO + insets.top }]}>
          <View
            pointerEvents="none"
            style={[
              styles.glow,
              { top: insets.top - 40, left: (width - 360) / 2 },
            ]}
          >
            <ShaderView
              preset="glow"
              width={360}
              height={360}
              colours={['#F9C08A', '#FA8C22', '#FFE1C2']}
            />
          </View>
          <View style={[styles.back, { top: insets.top + 6 }]}>
            <IconButton
              Icon={ChevronLeft}
              size={20}
              testID="back-button"
              accessibilityLabel={t.common.back}
              onPress={() => navigation.goBack()}
            />
          </View>
          <View style={[styles.targetWrap, { paddingTop: insets.top + 40 }]}>
            <Target reached={reached} />
          </View>
        </View>

        <View style={styles.head}>
          <Animated.Text
            entering={rise(0)}
            style={[typography.eyebrow, styles.saffron]}
          >
            {reached ? t.goalDone.reached : t.goalDone.ended}
          </Animated.Text>
          <Animated.Text
            entering={rise(1)}
            style={styles.goal}
            accessibilityRole="header"
          >
            {goal?.text ?? ''}
          </Animated.Text>
          <Animated.Text entering={rise(2)} style={styles.span}>
            {t.goalDone.span(shortDate(t, from), shortDate(t, today))}
          </Animated.Text>
        </View>

        <Animated.View entering={rise(3)} style={styles.stats}>
          <Stat value={days} label={t.goalDone.days} />
          <View style={styles.rule} />
          <Stat value={full} label={t.goalDone.full} accent />
          <View style={styles.rule} />
          <Stat value={half} label={t.goalDone.half} />
        </Animated.View>

        <Animated.View entering={rise(4)} style={styles.section}>
          <AppText variant="eyebrow">
            {t.goalDone.milestones(done, milestones.length)}
          </AppText>
          <View>
            {milestones.map((m, i) => (
              <Pressable
                key={m.id}
                testID={`goal-ms-${m.id}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: m.done }}
                onPress={() => {
                  haptics.selection();
                  state.toggleMilestone(m.id);
                }}
                style={styles.msRow}
              >
                <View style={styles.msRail}>
                  <View
                    style={[
                      styles.thread,
                      i === 0 && styles.threadFirst,
                      i === milestones.length - 1 && styles.threadLast,
                    ]}
                  />
                  <View style={[styles.node, m.done && styles.nodeDone]}>
                    {m.done ? (
                      <Check
                        width={12}
                        height={12}
                        color={colors.white}
                        strokeWidth={3}
                      />
                    ) : null}
                  </View>
                </View>
                <AppText
                  style={[styles.msText, !m.done && styles.msOpen]}
                  numberOfLines={2}
                >
                  {m.text}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={rise(5)} style={styles.section}>
          <AppText variant="eyebrow">{t.goalDone.journey}</AppText>
          <View style={styles.field}>
            {marks.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.tile,
                  { width: tile, height: tile, borderRadius: tile * 0.3 },
                  m === 'full'
                    ? styles.tileFull
                    : m === 'half'
                    ? styles.tileHalf
                    : null,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <AppText variant="detail" style={styles.restSub}>
          {t.goalDone.restSub}
        </AppText>
        <PrimaryButton
          testID="rest-now"
          label={t.goalDone.rest}
          onPress={() => {
            haptics.success();
            useBook.getState().finishGoal();
            navigation.replace('Rest');
          }}
        />
      </View>
    </View>
  );
}

/** Three rings that settle in one after another, the bullseye last. */
function Target({ reached }: { reached: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      200,
      withTiming(1, { duration: 1100, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    );
    if (reached) {
      const id = setTimeout(() => haptics.success(), 900);
      return () => clearTimeout(id);
    }
  }, [p, reached]);
  const size = RINGS[0] * 2;
  return (
    <View style={{ width: size, height: size }}>
      {RINGS.map((r, i) => (
        <Ring key={r} r={r} index={i} p={p} size={size} />
      ))}
      <Animated.View
        entering={FadeIn.delay(900).duration(400)}
        style={styles.bull}
      >
        <View style={styles.bullDisc}>
          <Check
            width={26}
            height={26}
            color={colors.saffron}
            strokeWidth={2.8}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function Ring({
  r,
  index,
  p,
  size,
}: {
  r: number;
  index: number;
  p: ReturnType<typeof useSharedValue<number>>;
  size: number;
}) {
  const style = useAnimatedStyle(() => {
    const local = Math.min(1, Math.max(0, p.value * 1.6 - index * 0.25));
    return {
      opacity: local,
      transform: [{ scale: 1.3 - local * 0.3 }],
    };
  });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r - 1}
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth={1.2}
          fill={
            index === RINGS.length - 1 ? 'rgba(255, 255, 255, 0.25)' : 'none'
          }
        />
      </Svg>
    </Animated.View>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <AppText style={[styles.statValue, accent && styles.saffron]}>
        {value}
      </AppText>
      <AppText variant="micro" style={styles.statLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    zIndex: -1,
  },
  glow: {
    position: 'absolute',
    width: 360,
    height: 360,
  },
  back: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  targetWrap: {
    alignItems: 'center',
  },
  bull: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullDisc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    boxShadow: '0px 10px 24px rgba(122, 52, 12, 0.22)',
  },
  head: {
    marginTop: spacing.section,
    paddingHorizontal: spacing.gutter,
    alignItems: 'center',
    gap: 10,
  },
  saffron: {
    color: colors.saffron,
  },
  goal: {
    ...typography.display,
    fontSize: 30,
    lineHeight: 35,
    textAlign: 'center',
    color: colors.ink,
  },
  span: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.26,
    color: INK_50,
  },
  stats: {
    marginTop: spacing.section,
    marginHorizontal: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    backgroundColor: colors.stone,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 32,
    color: colors.ink,
  },
  statLabel: {
    color: INK_50,
  },
  rule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: INK_06,
  },
  section: {
    marginTop: spacing.section,
    paddingHorizontal: spacing.gutter,
    gap: 16,
  },
  msRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 44,
  },
  msRail: {
    width: 22,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: colors.saffronLine,
  },
  threadFirst: {
    top: '50%',
  },
  threadLast: {
    bottom: '50%',
  },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.18)',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: {
    borderColor: colors.saffron,
    backgroundColor: colors.saffron,
  },
  msText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
  msOpen: {
    color: INK_50,
  },
  field: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
  },
  tile: {
    backgroundColor: INK_06,
  },
  tileFull: {
    backgroundColor: colors.saffron,
  },
  tileHalf: {
    backgroundColor: 'rgba(250, 140, 34, 0.35)',
  },
  footer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.gutter,
    gap: 12,
  },
  restSub: {
    textAlign: 'center',
  },
});
