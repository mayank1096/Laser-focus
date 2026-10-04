import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, radii, spacing, typography } from '../../theme';
import { now, today } from '../../utils/clock';
import { addDays, formatClock } from '../../utils/date';
import { PRATIGYAS, useProfile } from '../account/store';
import { planFor, usePlanning } from '../planning/store';
import { useGoalProgress } from '../progress';
import { MarkGrid } from '../session/components/MarkGrid';

const DATE = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
});

/** The first day: the vow is taken and the run of days begins. */
export function DayOneScreen({ navigation }: RootScreenProps<'DayOne'>) {
  const insets = useSafeAreaInsets();
  const pratigya = useProfile(s => s.pratigya) ?? 'arjun';
  const planning = usePlanning();
  const progress = useGoalProgress();
  const first = planFor(planning, addDays(today(), 1)).sessions[0];
  const squares = Math.min(progress.days, 60);

  return (
    <View style={styles.screen}>
      <Svg width="100%" height={420} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bloom" cx="50%" cy="38%" r="60%">
            <Stop offset="0" stopColor="#FA8C22" stopOpacity="0.55" />
            <Stop offset="1" stopColor="#E25E00" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="50%" cy="160" r="260" fill="url(#bloom)" />
      </Svg>
      <View style={[styles.body, { paddingTop: insets.top + spacing.xxl }]}>
        <Animated.View
          entering={FadeIn.duration(motion.slow)}
          style={styles.tag}
        >
          <AppText variant="micro" style={styles.tagText}>
            {`${PRATIGYAS[pratigya].latin} pratigya taken · ${DATE.format(
              now(),
            )}`}
          </AppText>
        </Animated.View>
        <Animated.Text
          entering={FadeInDown.delay(200).duration(motion.slow)}
          style={[typography.eyebrow, styles.eyebrow]}
        >
          {`Day 1 of ${progress.days}`}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(320).duration(motion.slow)}
          style={[typography.display, styles.title]}
        >
          The bow is in your hands now.
        </Animated.Text>
        <Animated.View
          entering={ZoomIn.delay(600).duration(motion.slow)}
          style={styles.grid}
        >
          <MarkGrid
            marks={Array.from({ length: squares }, (_, i) =>
              i === 0 ? 'full' : 'empty',
            )}
            size={14}
            gap={5}
            onDark
          />
          <AppText variant="micro" style={styles.gridNote}>
            One square a day. Fill them and the goal is yours.
          </AppText>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(800).duration(motion.slow)}
          style={styles.card}
        >
          <AppText variant="eyebrow">Your first session</AppText>
          <AppText variant="heading" style={styles.cardTitle}>
            {first
              ? `Tomorrow at ${formatClock(first.slot.start)}`
              : 'Tomorrow'}
          </AppText>
          <AppText variant="body" style={styles.muted}>
            Plan it tonight. Your values open first.
          </AppText>
        </Animated.View>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}>
        <PrimaryButton
          testID="next-button"
          label="Enter"
          shadow="none"
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.gutter,
    alignItems: 'center',
  },
  tag: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  tagText: {
    color: colors.ink,
  },
  eyebrow: {
    marginTop: 40,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  title: {
    marginTop: spacing.lg,
    color: colors.white,
    textAlign: 'center',
    fontSize: 38,
    lineHeight: 42,
  },
  grid: {
    marginTop: 36,
    alignSelf: 'stretch',
    gap: spacing.lg,
  },
  gridNote: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  card: {
    marginTop: 36,
    alignSelf: 'stretch',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: 18,
    backgroundColor: colors.parchment,
  },
  cardTitle: {
    marginTop: spacing.xs,
  },
  muted: {
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: spacing.gutter,
  },
});
