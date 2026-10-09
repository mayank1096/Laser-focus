import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { appDay, lastSeven } from '../../core/days';
import { dayMark, reviewDue, sessionsOn } from '../../core/home';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { addDays } from '../../utils/date';
import { WeekRow } from '../components/MarkBox';
import { PiercedEye } from '../components/PiercedEye';

/**
 * The day's last mark is in. A full day gets the pierced target; any other
 * day a quieter line. Below, the week's boxes and the one next thing.
 */
export function DayDoneScreen({
  navigation,
  route,
}: RootScreenProps<'DayDone'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const state = useBook();
  const today = appDay();
  const day = sessionsOn(state, route.params.date);
  const done = day.filter(s => s.mark === 'full').length;
  const full = day.length > 0 && done === day.length;
  const review = reviewDue(state, today);
  const days = lastSeven(today);
  const plan = () => navigation.replace('Plan', { date: addDays(today, 1) });

  return (
    <View testID="day-done" style={styles.screen}>
      {full ? <PiercedEye /> : <View style={styles.quiet} />}
      <View style={[styles.head, { top: full ? 390 : insets.top + 140 }]}>
        <Animated.Text
          entering={FadeIn.delay(full ? 900 : 200).duration(motion.slow)}
          style={[typography.eyebrow, styles.dim]}
        >
          {t.dayDone.title(done, day.length)}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(full ? 1000 : 300).duration(motion.slow)}
          style={styles.title}
        >
          {full ? t.dayDone.pierced : t.dayDone.dayOver}
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(full ? 1200 : 400).duration(motion.slow)}
          style={[typography.body, styles.dim, styles.center]}
        >
          {full ? t.dayDone.piercedSub : t.dayDone.dayOverSub}
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(full ? 1300 : 500)
          .duration(motion.slow)
          .easing(motion.easeOut)}
        style={[styles.panel, { paddingBottom: insets.bottom + 26 }]}
      >
        <WeekRow
          days={days}
          marks={days.map(d => dayMark(state, d))}
          today={today}
          letters={t.common.dayLetter}
          delayFor={d => (d === route.params.date ? 1600 : 0)}
        />
        <View style={styles.actions}>
          {review ? (
            <>
              <PrimaryButton
                testID="day-review"
                label={t.dayDone.review}
                onPress={() => navigation.replace('Review', { week: review })}
              />
              <Pressable
                testID="day-plan-first"
                accessibilityRole="button"
                hitSlop={10}
                onPress={plan}
                style={styles.link}
              >
                <AppText variant="label" style={styles.muted}>
                  {t.dayDone.planFirst}
                </AppText>
              </Pressable>
            </>
          ) : (
            <PrimaryButton
              testID="day-plan"
              label={t.dayDone.plan}
              onPress={plan}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
  },
  quiet: {
    height: 1,
  },
  head: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.gutter,
  },
  dim: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  center: {
    textAlign: 'center',
  },
  title: {
    ...typography.display,
    fontSize: 38,
    lineHeight: 44,
    color: colors.white,
    textAlign: 'center',
  },
  panel: {
    marginTop: 'auto',
    paddingTop: 26,
    paddingHorizontal: spacing.gutter,
    gap: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.parchment,
  },
  actions: {
    gap: spacing.lg,
  },
  link: {
    alignSelf: 'center',
  },
  muted: {
    color: colors.textMuted,
  },
});
