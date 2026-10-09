import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Check from '../../assets/icons/check.svg';
import { AppText } from '../../components/AppText';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, motion, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { haptics } from '../../utils/haptics';
import { FocusDial } from '../components/FocusDial';

/** The screen dims this long after the last touch. */
const DIM_AFTER = 5000;

/**
 * During a session the phone is mostly dark. When woken, it shows the dial
 * turning saffron as the session passes, the time left, and five boxes for
 * the course's attention stages. "I'm done" goes to the mark; holding
 * anywhere opens the red end-early screen.
 *
 * TODO(devs): keep the screen awake (react-native-keep-awake) and post an
 * ongoing notification so the timer survives the app being closed.
 */
export function InProgressScreen({
  navigation,
  route,
}: RootScreenProps<'InProgress'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const session = useBook(s => s.sessions.find(x => x.id === route.params.id));
  const [tick, setTick] = useState(now());
  const halfway = useRef(false);
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

  const total = (session?.minutes ?? 1) * 60;
  const elapsed = session?.startedAt
    ? Math.max(0, (tick.getTime() - Date.parse(session.startedAt)) / 1000)
    : 0;

  useEffect(() => {
    if (!halfway.current && elapsed >= total / 2) {
      halfway.current = true;
      // Only pulse if we crossed it just now, not on reopening late.
      if (elapsed - total / 2 < 5) {
        haptics.pattern.halfway();
      }
    }
  }, [elapsed, total]);

  const veil = useAnimatedStyle(() => ({ opacity: dim.value * 0.92 }));

  if (!session?.startedAt) {
    return <View style={styles.screen} />;
  }
  const left = total - elapsed;
  const shown = Math.abs(left);
  const hh = Math.floor(shown / 3600);
  const mm = Math.floor((shown % 3600) / 60);
  const ss = Math.floor(shown % 60);
  const two = (n: number) => String(n).padStart(2, '0');
  // 1:59:57 past the hour, 45:00 under it.
  const clockText = hh ? `${hh}:${two(mm)}:${two(ss)}` : `${mm}:${two(ss)}`;
  const planned = t.common.minutes(session.minutes);

  const minutes = elapsed / 60;
  const stages = t.stages;
  const stage = stages.reduce((cur, s, i) => (minutes >= s.from ? i : cur), 0);
  const stageEnd =
    stages[stage + 1]?.from ??
    Math.max(stages[stage].from + 10, session.minutes);
  const inStage = Math.min(
    1,
    (minutes - stages[stage].from) / Math.max(1, stageEnd - stages[stage].from),
  );
  const endEarly = () => {
    haptics.warning();
    navigation.navigate('EndEarly', { id: session.id });
  };

  return (
    <Pressable
      testID="in-progress"
      style={styles.screen}
      onPress={wake}
      onLongPress={endEarly}
      delayLongPress={1000}
      accessibilityActions={[{ name: 'longpress', label: t.endEarly.title }]}
      onAccessibilityAction={endEarly}
    >
      <View style={[styles.top, { paddingTop: insets.top + spacing.xxl }]}>
        <AppText variant="label" style={styles.soft} numberOfLines={2}>
          {session.what}
        </AppText>
        <AppText variant="micro" style={styles.faint}>
          {`${clock(t, session.start)} – ${clock(
            t,
            session.start + session.minutes,
          )}`}
        </AppText>
      </View>

      <View style={styles.middle}>
        <Animated.View entering={FadeIn.duration(motion.cinematic)}>
          <FocusDial elapsed={Math.min(elapsed, total)} total={total}>
            <AppText style={styles.time} testID="time-left">
              {`${left < 0 ? '+' : ''}${clockText}`}
            </AppText>
            <AppText variant="micro" style={styles.faint}>
              {left >= 0 ? t.progress.left(planned) : t.progress.over(planned)}
            </AppText>
          </FocusDial>
        </Animated.View>

        <View style={styles.readout}>
          <AppText style={styles.stageName}>{stages[stage].name}</AppText>
          <View style={styles.stages}>
            {stages.map((st, i) => (
              <StageBox
                key={st.from}
                state={i < stage ? 'done' : i === stage ? 'now' : 'ahead'}
                fill={i === stage ? inStage : 0}
              />
            ))}
          </View>
          <AppText style={styles.line}>{stages[stage].line}</AppText>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable
          testID="im-done"
          accessibilityRole="button"
          onPress={() => {
            haptics.confirm();
            navigation.replace('Mark', { id: session.id });
          }}
          style={({ pressed }) => [styles.done, pressed && styles.pressed]}
        >
          <AppText style={styles.doneLabel}>{t.progress.done}</AppText>
        </Pressable>
        <AppText variant="micro" style={styles.faint}>
          {t.endEarly.holdHint}
        </AppText>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.veil, veil]}
      />
    </Pressable>
  );
}

/** One attention stage: ticked once passed, filling while you're in it. */
function StageBox({
  state,
  fill,
}: {
  state: 'done' | 'now' | 'ahead';
  fill: number;
}) {
  const level = useSharedValue(fill);
  useEffect(() => {
    level.value = withTiming(fill, { duration: 1000, easing: motion.easeOut });
  }, [fill, level]);
  const fillStyle = useAnimatedStyle(() => ({
    height: `${level.value * 100}%`,
  }));
  return (
    <View
      style={[
        styles.box,
        state === 'done' && styles.boxDone,
        state === 'now' && styles.boxNow,
      ]}
    >
      {state === 'now' ? (
        <Animated.View style={[styles.boxFill, fillStyle]} />
      ) : null}
      {state === 'done' ? (
        <Check width={14} height={14} color={colors.night} strokeWidth={2.4} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: 'center',
  },
  top: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.gutter,
  },
  soft: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  faint: {
    color: 'rgba(255, 255, 255, 0.28)',
    textAlign: 'center',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readout: {
    marginTop: 36,
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontFamily: fonts.sansBold,
    fontSize: 54,
    lineHeight: 62,
    letterSpacing: -1.5,
    color: 'rgba(255, 255, 255, 0.92)',
    fontVariant: ['tabular-nums'],
  },
  stageName: {
    ...typography.heading,
    color: 'rgba(255, 255, 255, 0.86)',
  },
  stages: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.lg,
  },
  box: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  boxDone: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderColor: 'transparent',
  },
  boxNow: {
    borderColor: colors.saffron,
    justifyContent: 'flex-end',
  },
  boxFill: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(250, 140, 34, 0.32)',
  },
  line: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: spacing.sm,
  },
  bottom: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.gutter,
  },
  done: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  pressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  doneLabel: {
    ...typography.button,
    color: 'rgba(255, 255, 255, 0.86)',
  },
  veil: {
    backgroundColor: '#000',
  },
});
