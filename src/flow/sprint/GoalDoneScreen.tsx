import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChevronLeft from '../../assets/icons/chevron-left.svg';
import { AppText } from '../../components/AppText';
import { IconButton } from '../../components/IconButton';
import { sansDigits } from '../../components/Numerals';
import { ShaderView } from '../../components/shader';
import { appDay } from '../../core/days';
import { activeMilestones } from '../../core/home';
import { circledGoal, useBook } from '../../core/store';
import { useT } from '../../i18n';
import { monthLabel, shortDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, motion, typography } from '../../theme';
import { daysBetween } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { countDays } from '../components/Calendar';

const GUTTER = 22;
/** The haze behind the whole screen: dark, ember, body, light. */
const MIST = ['#140806', '#6E2410', '#C2561E', '#EBA06A'];
const WHITE_90 = 'rgba(255, 255, 255, 0.9)';
const WHITE_60 = 'rgba(255, 255, 255, 0.6)';
const WHITE_45 = 'rgba(255, 255, 255, 0.45)';
const HAIRLINE = 'rgba(255, 255, 255, 0.12)';

/**
 * A goal reached, or a sprint ended. One quiet page on a slow haze: the
 * goal, the run in three numbers, and the milestones as a ruled list.
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
  const reached = milestones.length > 0 && milestones.every(m => m.done);

  const rest = () => {
    haptics.success();
    useBook.getState().finishGoal();
    navigation.replace('Rest');
  };

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
        contentContainerStyle={{
          paddingTop: insets.top + 6,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bar}>
          <IconButton
            Icon={ChevronLeft}
            size={20}
            color={colors.white}
            testID="back-button"
            accessibilityLabel={t.common.back}
            onPress={() => navigation.goBack()}
          />
          <AppText style={styles.barTitle}>
            {reached ? t.goalDone.reached : t.goalDone.ended}
          </AppText>
          <View style={styles.barSpace} />
        </View>

        <Animated.View
          entering={FadeIn.duration(motion.slow)}
          style={styles.head}
        >
          <AppText style={styles.goal} accessibilityRole="header">
            {sansDigits(goal?.text ?? '')}
          </AppText>
          <AppText style={styles.span}>
            {t.goalDone.span(shortDate(t, from), shortDate(t, today))}
          </AppText>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(200).duration(motion.slow)}
          style={styles.stats}
        >
          <Stat value={days} label={t.goalDone.days} />
          <Stat value={full} label={t.goalDone.full} />
          <Stat value={half} label={t.goalDone.half} />
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(400).duration(motion.slow)}
          style={styles.list}
        >
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
              style={styles.row}
            >
              <AppText style={styles.rowLead}>
                {m.month
                  ? monthLabel(t, m.month)
                  : String(i + 1).padStart(2, '0')}
              </AppText>
              <AppText
                style={[styles.rowText, !m.done && styles.rowOpen]}
                numberOfLines={2}
              >
                {m.text}
              </AppText>
              <View style={[styles.tick, m.done && styles.tickDone]} />
            </Pressable>
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(600).duration(motion.slow)}
        style={[styles.footer, { bottom: insets.bottom + 24 }]}
        pointerEvents="box-none"
      >
        <Pressable
          testID="rest-now"
          accessibilityRole="button"
          onPress={rest}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
        >
          <AppText style={styles.pillText}>{t.goalDone.rest}</AppText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText style={styles.statValue}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MIST[0],
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: WHITE_90,
  },
  barSpace: {
    width: 36,
  },
  head: {
    marginTop: 28,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 8,
  },
  goal: {
    ...typography.heading,
    fontSize: 22,
    lineHeight: 27,
    textAlign: 'center',
    color: colors.white,
  },
  span: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.26,
    color: WHITE_60,
  },
  stats: {
    marginTop: 64,
    flexDirection: 'row',
    paddingHorizontal: GUTTER,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontFamily: fonts.sans,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
    color: colors.white,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.26,
    color: WHITE_60,
  },
  list: {
    marginTop: 56,
    marginHorizontal: GUTTER,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: HAIRLINE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 54,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: HAIRLINE,
  },
  rowLead: {
    width: 64,
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.26,
    color: WHITE_45,
  },
  rowText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: WHITE_90,
  },
  rowOpen: {
    color: WHITE_45,
  },
  tick: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: WHITE_45,
  },
  tickDone: {
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 999,
    backgroundColor: colors.cream,
    boxShadow: '0px 12px 30px rgba(0, 0, 0, 0.35)',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  pillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
  },
});
