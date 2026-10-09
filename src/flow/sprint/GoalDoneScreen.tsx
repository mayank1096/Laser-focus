import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Check from '../../assets/icons/check.svg';
import ChevronLeft from '../../assets/icons/chevron-left.svg';
import { AppText } from '../../components/AppText';
import { IconButton } from '../../components/IconButton';
import { sansDigits } from '../../components/Numerals';
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

const GUTTER = 22;
const WHITE_45 = 'rgba(255, 255, 255, 0.45)';
const WHITE_70 = 'rgba(255, 255, 255, 0.72)';
/** The haze behind the whole screen: dark, ember, body, light. */
const MIST = ['#140806', '#6E2410', '#C2561E', '#EBA06A'];
/** The same grid as Home: nineteen squares a row, one per day. */
const PER_ROW = 19;
const TILE_GAP = 4;

/**
 * A goal reached, or a sprint ended. The goal sits on the same silk it
 * lived on at Home, and under it every day of the run fills in, one box
 * after another, as it happened. Below: the milestones as a thread.
 */
export function GoalDoneScreen({ navigation }: RootScreenProps<'GoalDone'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const state = useBook();
  const goal = circledGoal(state);
  const today = appDay();
  const from = state.sprintStart ?? today;
  const { full, half } = countDays(state, from, today);
  const days = Math.max(1, daysBetween(from, today) + 1);
  const milestones = activeMilestones(state);
  const done = milestones.filter(m => m.done).length;
  const reached = milestones.length > 0 && done === milestones.length;
  const tile = (width - GUTTER * 2 - TILE_GAP * (PER_ROW - 1)) / PER_ROW;
  // A short run plays back box by box; a long one arrives at once.
  const step = days <= 120 ? Math.min(40, 1100 / days) : 0;
  const marks: (Mark | null)[] = Array.from({ length: days }, (_, i) =>
    dayMark(state, addDays(from, i)),
  );

  return (
    <View style={styles.screen} testID="goal-done">
      <ShaderView
        preset="mist"
        width={width}
        height={height}
        colours={MIST}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 6 }]}>
          <View style={styles.back}>
            <IconButton
              Icon={ChevronLeft}
              size={20}
              color={colors.white}
              testID="back-button"
              accessibilityLabel={t.common.back}
              onPress={() => navigation.goBack()}
            />
          </View>
          <Animated.Text entering={rise(0)} style={styles.eyebrow}>
            {`${
              reached ? t.goalDone.reached : t.goalDone.ended
            } · ${t.goalDone.span(shortDate(t, from), shortDate(t, today))}`}
          </Animated.Text>
          <Animated.Text
            entering={rise(1)}
            style={styles.goal}
            accessibilityRole="header"
          >
            {sansDigits(goal?.text ?? '')}
          </Animated.Text>
          <View
            style={[styles.field, { gap: TILE_GAP }]}
            accessibilityLabel={t.goalDone.summary(days, full, half)}
          >
            {marks.map((m, i) => (
              <Animated.View
                key={i}
                entering={
                  step ? FadeIn.delay(500 + i * step).duration(220) : undefined
                }
                style={[
                  styles.tile,
                  { width: tile, height: tile, borderRadius: tile * 0.28 },
                ]}
              >
                {m === 'full' ? <View style={styles.tileFull} /> : null}
                {m === 'half' ? (
                  <View style={[styles.tileHalf, { width: tile / 2 }]} />
                ) : null}
              </Animated.View>
            ))}
          </View>
          <Animated.Text
            entering={FadeIn.delay(600 + days * step).duration(400)}
            style={styles.summary}
          >
            {t.goalDone.summary(days, full, half)}
          </Animated.Text>
        </View>

        <Animated.View entering={rise(2)} style={styles.section}>
          <AppText variant="eyebrow" style={styles.light}>
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
                        color={MIST[1]}
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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <AppText variant="detail" style={[styles.restSub, styles.light]}>
          {t.goalDone.restSub}
        </AppText>
        <PrimaryButton
          tone="light"
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MIST[0],
  },
  hero: {
    paddingHorizontal: GUTTER,
    paddingBottom: 40,
  },
  light: {
    color: WHITE_70,
  },
  back: {
    marginLeft: -10,
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  eyebrow: {
    ...typography.eyebrow,
    color: WHITE_70,
  },
  goal: {
    ...typography.display,
    fontSize: 38,
    lineHeight: 42,
    marginTop: 12,
    color: colors.white,
  },
  field: {
    marginTop: 36,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  tileFull: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.white,
  },
  tileHalf: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.white,
  },
  summary: {
    marginTop: 16,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: WHITE_70,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: GUTTER,
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
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
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
    borderColor: WHITE_45,
    backgroundColor: MIST[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDone: {
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  msText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
  },
  msOpen: {
    color: WHITE_45,
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
