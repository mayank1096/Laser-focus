import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { appDay, lastSeven } from '../../core/days';
import { dayMark, reviewDue, sessionsOn } from '../../core/home';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { addDays } from '../../utils/date';
import { WeekRow } from '../components/MarkBox';

/** The day's row, the count, and the one next thing: plan tomorrow. */
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
  const review = reviewDue(state, today);
  const days = lastSeven(today);
  const plan = () => navigation.replace('Plan', { date: addDays(today, 1) });

  return (
    <View
      testID="day-done"
      style={[
        styles.screen,
        { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Animated.View entering={rise(0)}>
        <WeekRow
          days={days}
          marks={days.map(d => dayMark(state, d))}
          today={today}
          letters={t.common.dayLetter}
        />
      </Animated.View>
      <Animated.Text
        entering={rise(1)}
        style={[typography.display, styles.title]}
      >
        {t.dayDone.title(done, day.length)}
      </Animated.Text>
      <View style={styles.footer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.stone,
    paddingHorizontal: spacing.gutter,
  },
  title: {
    marginTop: 48,
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.lg,
  },
  link: {
    alignSelf: 'center',
  },
  muted: {
    color: colors.textMuted,
  },
});
