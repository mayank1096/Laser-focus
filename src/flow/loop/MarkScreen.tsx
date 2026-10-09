import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { appDay, lastSeven } from '../../core/days';
import { dayMark, sessionsOn } from '../../core/home';
import type { Mark } from '../../core/model';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clockOf } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';
import { MarkPad, WeekRow } from '../components/MarkBox';

const PAD = 196;

/**
 * Fill the box with your own hand. Hold for ●, swipe across for the
 * zig-zag, or say it didn't happen. As it fills, the same day's box in the
 * row above fills too. That is the whole reward.
 */
export function MarkScreen({ navigation, route }: RootScreenProps<'Mark'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const state = useBook();
  const session = state.sessions.find(x => x.id === route.params.id);
  const [mark, setMark] = useState<Mark | null>(session?.mark ?? null);
  const [finished, setFinished] = useState(session?.outcome ?? '');
  const [wrong, setWrong] = useState<Set<string>>(
    new Set(session?.wentWrong ?? []),
  );
  const fill = useSharedValue(mark === 'full' ? 1 : 0);
  const zig = useSharedValue(mark === 'half' ? 1 : 0);
  if (!session) {
    return null;
  }
  const today = appDay();
  const days = lastSeven(today);

  const choose = (m: Mark) => {
    setMark(m);
    fill.value = withTiming(m === 'full' ? 1 : 0, { duration: 300 });
    zig.value = withTiming(m === 'half' ? 1 : 0, { duration: 300 });
    useBook.getState().markSession(session.id, m);
  };

  const reset = () => {
    setMark(null);
    fill.value = withTiming(0, { duration: 300 });
    zig.value = withTiming(0, { duration: 300 });
  };

  const nextSession =
    session.date === today
      ? sessionsOn(state, today).find(
          s => s.order > session.order && !s.mark && !s.startedAt,
        )
      : undefined;

  const proceed = () => {
    if (!mark) {
      return;
    }
    useBook
      .getState()
      .markSession(
        session.id,
        mark,
        mark === 'full'
          ? { finished: finished.trim() || session.outcome }
          : { wentWrong: [...wrong] },
      );
    haptics.tap();
    if (nextSession) {
      navigation.replace('Start', { id: nextSession.id });
    } else {
      navigation.replace('DayDone', { date: session.date });
    }
  };

  const reasons = [
    ...new Set([
      ...(session.wentWrong ?? []),
      ...(session.dontDo ?? []),
      t.mark.reasons.phone,
      t.mark.reasons.sleep,
      t.mark.reasons.mood,
      t.mark.reasons.time,
      t.mark.reasons.other,
    ]),
  ];

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + spacing.xl }]}
      testID="mark"
    >
      <WeekRow
        days={days}
        marks={days.map(d => dayMark(state, d))}
        today={today}
        letters={t.common.dayLetter}
        size={30}
        delayFor={d => (d === session.date ? 250 : 0)}
      />

      <View style={styles.head}>
        <AppText style={typography.heading} numberOfLines={2}>
          {t.mark.title(session.order + 1, session.what)}
        </AppText>
        <AppText variant="body" style={styles.muted}>
          {session.outcome}
        </AppText>
      </View>

      <View style={styles.padWrap}>
        <MarkPad
          size={PAD}
          fill={fill}
          zig={zig}
          locked={mark !== null}
          onMark={choose}
        />
        {mark === null ? (
          <>
            <AppText variant="caption" style={styles.howTo}>
              {t.mark.howTo}
            </AppText>
            <View style={styles.alt}>
              <Link
                testID="mark-full"
                label={t.mark.tapFull}
                onPress={() => choose('full')}
              />
              <Link
                testID="mark-half"
                label={t.mark.tapHalf}
                onPress={() => choose('half')}
              />
              <Link
                testID="mark-empty"
                label={t.mark.empty}
                onPress={() => choose('empty')}
              />
            </View>
          </>
        ) : (
          <Animated.View
            entering={FadeIn.duration(motion.base)}
            style={styles.verdict}
          >
            <AppText variant="bodyMedium">
              {mark === 'full'
                ? t.mark.full
                : mark === 'half'
                ? t.mark.half
                : t.mark.empty}
            </AppText>
            <Link testID="mark-change" label={t.mark.change} onPress={reset} />
          </Animated.View>
        )}
      </View>

      {mark ? (
        <Animated.View
          entering={FadeInDown.duration(motion.slow).easing(motion.easeOut)}
          style={styles.after}
        >
          {mark === 'full' ? (
            <>
              <AppText variant="eyebrow">{t.mark.finished}</AppText>
              <TextField
                testID="finished"
                accessibilityLabel={t.mark.finished}
                value={finished}
                onChangeText={setFinished}
              />
            </>
          ) : (
            <>
              <AppText variant="eyebrow">{t.mark.wentWrong}</AppText>
              <ChipRow>
                {reasons.map(r => (
                  <Chip
                    key={r}
                    testID={`why-${r}`}
                    role="checkbox"
                    label={r}
                    selected={wrong.has(r)}
                    onPress={() =>
                      setWrong(prev => {
                        const next = new Set(prev);
                        if (next.has(r)) {
                          next.delete(r);
                        } else {
                          next.add(r);
                        }
                        return next;
                      })
                    }
                  />
                ))}
              </ChipRow>
            </>
          )}
          {session.startedAt ? (
            <AppText variant="micro" style={styles.muted}>
              {t.mark.meta(
                clockOf(t, new Date(session.startedAt)),
                t.common.minutes(session.minutes),
              )}
            </AppText>
          ) : null}
        </Animated.View>
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          testID="mark-next"
          label={
            nextSession ? t.mark.next(nextSession.order + 1) : t.common.done
          }
          disabled={!mark}
          onPress={proceed}
        />
      </View>
    </View>
  );
}

function Link({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
    >
      <AppText variant="label" style={styles.link}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.stone,
    paddingHorizontal: spacing.gutter,
  },
  head: {
    marginTop: 28,
    gap: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
  padWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  howTo: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  alt: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: 22,
  },
  link: {
    color: colors.saffron,
  },
  verdict: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  after: {
    marginTop: 24,
    gap: spacing.md,
  },
  footer: {
    marginTop: 'auto',
  },
});
