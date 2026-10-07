import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { HoldButton } from '../../components/HoldButton';
import { rise } from '../../components/QuestionHeader';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { planFor, usePlanning } from '../planning/store';
import { HALF_MARK_MINUTES, useSessions } from './store';

/** Ending early is a serious act; the whole screen says so. */
const DEEP_RED = '#7A0C12';

const REASONS = ['Family emergency', 'Health', 'Called away', 'I gave in'];

/** There is no pause. Ending early is possible, but it is a held decision. */
export function EmergencyEndScreen({
  navigation,
}: RootScreenProps<'EmergencyEnd'>) {
  const insets = useSafeAreaInsets();
  const active = useSessions(s => s.active);
  const end = useSessions(s => s.end);
  const planning = usePlanning();
  const [reason, setReason] = useState<string | null>(null);
  if (!active) {
    return <View style={styles.screen} />;
  }
  const sat = Math.floor(
    (now().getTime() - Date.parse(active.startedAt)) / 60000,
  );
  const counts = sat >= HALF_MARK_MINUTES;
  const task = planFor(planning, active.date).sessions.find(
    s => s.slot.id === active.slotId,
  )?.task;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 56 }]}>
      <Animated.Text
        entering={rise(0)}
        style={[typography.eyebrow, styles.dim]}
      >
        {`${sat} min in${task ? ` · ${task.text}` : ''}`}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.white, styles.title]}
      >
        End early?
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={[typography.body, styles.soft]}>
        {counts
          ? 'Past 10 minutes, so it still counts as a half mark. Your streak holds.'
          : `Under ${HALF_MARK_MINUTES} minutes, this one won’t count. ${
              HALF_MARK_MINUTES - sat
            } more and it would.`}
      </Animated.Text>
      <Animated.View entering={rise(3)} style={styles.reasons}>
        <AppText variant="eyebrow" style={styles.dim}>
          What happened
        </AppText>
        <ChipRow>
          {REASONS.map(r => (
            <Chip
              key={r}
              testID={`reason-${r}`}
              role="radio"
              label={r}
              selected={reason === r}
              onColor
              onPress={() => setReason(r)}
            />
          ))}
        </ChipRow>
        <AppText variant="caption" style={styles.dim}>
          Honest answers make better sheets.
        </AppText>
      </Animated.View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <HoldButton
          testID="end-hold"
          label="Hold to end"
          onDark
          tone="red"
          duration={2000}
          onComplete={() => {
            const result = end(now(), { reason: reason ?? 'Not said' });
            navigation.reset({
              index: 1,
              routes: [
                { name: 'Main' },
                {
                  name: 'StreakMark',
                  params: { date: result?.date ?? active.date },
                },
              ],
            });
          }}
        />
        <Pressable
          testID="back-to-focus"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <AppText variant="label" style={styles.soft}>
            Back to focus
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DEEP_RED,
    paddingHorizontal: spacing.gutter,
  },
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  white: {
    color: colors.white,
  },
  soft: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  dim: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  reasons: {
    marginTop: 30,
    gap: spacing.md,
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.lg,
  },
  back: {
    alignSelf: 'center',
  },
});
