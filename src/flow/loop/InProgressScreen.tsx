import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clockOf } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, motion, spacing } from '../../theme';
import { now } from '../../utils/clock';
import { haptics } from '../../utils/haptics';
import { FocusDial } from '../components/FocusDial';

const DIM_AFTER = 5000;

/**
 * Dark and almost empty. What the app shows, whatever brings you back to
 * it, while a session runs: the dial, "I'm done", and a quiet way out if
 * the session never really started.
 */
export function InProgressScreen({
  navigation,
  route,
}: RootScreenProps<'InProgress'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const session = useBook(s => s.sessions.find(x => x.id === route.params.id));
  const [tick, setTick] = useState(now());
  const dim = useSharedValue(0);
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wake = () => {
    dim.value = withTiming(0, { duration: motion.base });
    if (dimTimer.current) {
      clearTimeout(dimTimer.current);
    }
    dimTimer.current = setTimeout(() => {
      dim.value = withTiming(1, { duration: 1600 });
    }, DIM_AFTER);
  };

  useEffect(() => {
    wake();
    const id = setInterval(() => setTick(now()), 1000);
    return () => {
      clearInterval(id);
      if (dimTimer.current) {
        clearTimeout(dimTimer.current);
      }
    };
    // Once, on entering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const veil = useAnimatedStyle(() => ({ opacity: dim.value * 0.9 }));

  if (!session?.startedAt) {
    return <View style={styles.screen} />;
  }
  const started = new Date(session.startedAt);
  const total = session.minutes * 60;
  const elapsed = Math.max(0, (tick.getTime() - started.getTime()) / 1000);
  const left = total - elapsed;
  const shown = Math.abs(left);
  const hh = Math.floor(shown / 3600);
  const mm = Math.floor((shown % 3600) / 60);
  const ss = Math.floor(shown % 60);
  const two = (n: number) => String(n).padStart(2, '0');
  // 1:59:57 past the hour, 45:00 under it.
  const clockText = hh ? `${hh}:${two(mm)}:${two(ss)}` : `${mm}:${two(ss)}`;
  const planned = t.common.minutes(session.minutes);

  return (
    <Pressable testID="in-progress" style={styles.screen} onPress={wake}>
      <View style={[styles.top, { paddingTop: insets.top + spacing.xxl }]}>
        <AppText variant="label" style={styles.soft}>
          {t.progress.since(session.order + 1, clockOf(t, started))}
        </AppText>
        <AppText variant="micro" style={styles.faint}>
          {t.progress.putBack}
        </AppText>
      </View>

      <Animated.View
        entering={FadeIn.duration(motion.cinematic)}
        style={styles.middle}
      >
        <FocusDial elapsed={Math.min(elapsed, total)} total={total}>
          <AppText style={styles.time} testID="time-left">
            {`${left < 0 ? '+' : ''}${clockText}`}
          </AppText>
          <AppText variant="micro" style={styles.faint}>
            {left >= 0 ? t.progress.left(planned) : t.progress.over(planned)}
          </AppText>
        </FocusDial>
        <AppText
          variant="label"
          style={[styles.soft, styles.what]}
          numberOfLines={2}
        >
          {session.what}
        </AppText>
      </Animated.View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <PrimaryButton
          testID="im-done"
          label={t.progress.done}
          tone="light"
          shadow="none"
          onPress={() => {
            haptics.confirm();
            navigation.replace('Mark', { id: session.id });
          }}
        />
        <Pressable
          testID="not-started"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => {
            useBook.getState().unstartSession(session.id);
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
          style={styles.link}
        >
          <AppText variant="micro" style={styles.faint}>
            {t.progress.notStarted}
          </AppText>
        </Pressable>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.veil, veil]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
  },
  top: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.gutter,
  },
  soft: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  faint: {
    color: 'rgba(255, 255, 255, 0.32)',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontFamily: fonts.sansBold,
    fontSize: 58,
    lineHeight: 64,
    letterSpacing: -1.5,
    color: 'rgba(255, 255, 255, 0.92)',
    fontVariant: ['tabular-nums'],
  },
  what: {
    marginTop: 28,
    paddingHorizontal: spacing.gutter,
  },
  bottom: {
    paddingHorizontal: spacing.gutter,
    gap: spacing.lg,
  },
  link: {
    alignSelf: 'center',
  },
  veil: {
    backgroundColor: '#000',
  },
});
