import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { rise } from '../../../components/QuestionHeader';
import { TAB_BAR_CLEARANCE } from '../../../components/TabBar';
import type { Id } from '../../../types/models';
import { colors, spacing } from '../../../theme';
import { today } from '../../../utils/clock';
import { formatClock, formatDay } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { planFor, usePlanning, type SessionView } from '../store';

/**
 * Today's sessions, each one tap from starting.
 *
 * TODO(devs): the full Home (Figma 2.01: goal hero, progress, quote) replaces
 * this list; keep `onStart` as the way a session begins, so the morning gate
 * still guards sessions without a sheet.
 */
export function TodayScreen({ onStart }: { onStart: (slotId: Id) => void }) {
  const insets = useSafeAreaInsets();
  const state = usePlanning();
  const day = planFor(state, today());

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
    >
      <Animated.View entering={rise(0)} style={styles.header}>
        <AppText variant="eyebrow">{formatDay(day.date)}</AppText>
        <AppText variant="title" accessibilityRole="header">
          Today
        </AppText>
      </Animated.View>
      <Animated.View entering={rise(1)} style={styles.list}>
        {day.sessions.map(session => (
          <SessionCard
            key={session.slot.id}
            session={session}
            onPress={() => onStart(session.slot.id)}
          />
        ))}
      </Animated.View>
    </ScrollView>
  );
}

function SessionCard({
  session,
  onPress,
}: {
  session: SessionView;
  onPress: () => void;
}) {
  const { slot, task, sheet } = session;
  const status = sheet ? 'Start' : 'Write sheet to start';
  return (
    <Pressable
      testID={`today-${slot.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${formatClock(slot.start)}. ${
        task?.text ?? 'No task yet'
      }. ${status}`}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.time}>
        <AppText variant="bodyBold">{formatClock(slot.start)}</AppText>
        <AppText variant="micro" style={styles.muted}>
          {`${sheet?.minutes ?? slot.minutes} min`}
        </AppText>
      </View>
      <View style={styles.rule} />
      <View style={styles.body}>
        <AppText variant="bodyMedium" numberOfLines={2}>
          {sheet?.outcome ?? task?.text ?? 'No task yet'}
        </AppText>
        <AppText
          variant="micro"
          style={{ color: sheet ? colors.textMuted : colors.saffron }}
        >
          {sheet ? `${task?.text ?? ''}  ·  Start →` : `${status} →`}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  content: {
    paddingHorizontal: 22,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.7,
  },
  time: {
    width: 64,
    gap: spacing.xxs,
  },
  muted: {
    color: colors.textMuted,
  },
  rule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.hairline,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
});
