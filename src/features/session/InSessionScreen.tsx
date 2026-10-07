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
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, motion, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { formatClock } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { planFor, usePlanning } from '../planning/store';
import { FocusDial } from './components/FocusDial';
import { STAGES } from './ritual/content';
import { useSessions } from './store';

/** The screen dims this long after the last touch. */
const DIM_AFTER = 5000;

/**
 * During a session the phone is mostly dark. When woken, it shows the dial:
 * a ring of ticks that turns saffron as the session passes, the time left
 * in the middle, and a row of five boxes for the course's attention stages.
 * Hold anywhere to end early.
 *
 * TODO(devs): keep the screen from locking (react-native-keep-awake) and
 * post an ongoing notification so the timer survives the app being closed.
 */
export function InSessionScreen({ navigation }: RootScreenProps<'InSession'>) {
  const insets = useSafeAreaInsets();
  const active = useSessions(s => s.active);
  const end = useSessions(s => s.end);
  const planning = usePlanning();
  const recordSession = usePlanning(s => s.recordSession);
  const [t, setT] = useState(now());
  const halfwayDone = useRef(false);
  const ended = useRef(false);
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
    const id = setInterval(() => setT(now()), 1000);
    return () => {
      clearInterval(id);
      if (dimTimer.current) {
        clearTimeout(dimTimer.current);
      }
    };
    // Once, on entering the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = (active?.minutes ?? 1) * 60;
  const elapsed = active
    ? Math.max(0, (t.getTime() - Date.parse(active.startedAt)) / 1000)
    : 0;
  const remaining = Math.max(0, total - elapsed);

  useEffect(() => {
    if (!active || ended.current) {
      return;
    }
    if (!halfwayDone.current && elapsed >= total / 2) {
      halfwayDone.current = true;
      // Only pulse if we crossed it just now, not on reopening late.
      if (elapsed - total / 2 < 5) {
        haptics.pattern.halfway();
      }
    }
    if (remaining <= 0) {
      ended.current = true;
      haptics.pattern.end();
      const result = end(now());
      if (result?.taskId) {
        recordSession(result.taskId);
      }
      if (result) {
        navigation.replace('SessionDone', {
          date: result.date,
          slotId: result.slotId,
        });
      }
    }
  }, [active, elapsed, total, remaining, end, recordSession, navigation]);

  const veil = useAnimatedStyle(() => ({ opacity: dim.value * 0.92 }));

  if (!active) {
    return <View style={styles.screen} />;
  }

  const session = planFor(planning, active.date).sessions.find(
    s => s.slot.id === active.slotId,
  );
  const minutes = elapsed / 60;
  const stage = STAGES.reduce((cur, s, i) => (minutes >= s.from ? i : cur), 0);
  const stageEnd =
    STAGES[stage + 1]?.from ??
    Math.max(STAGES[stage].from + 10, active.minutes);
  const inStage = Math.min(
    1,
    (minutes - STAGES[stage].from) / Math.max(1, stageEnd - STAGES[stage].from),
  );
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);

  return (
    <Pressable
      testID="in-session"
      style={styles.screen}
      onPress={wake}
      onLongPress={() => {
        haptics.warning();
        navigation.navigate('EmergencyEnd');
      }}
      delayLongPress={1000}
      accessibilityLabel={`${mm} minutes left. Hold to end early.`}
      accessibilityActions={[{ name: 'longpress', label: 'End early' }]}
      onAccessibilityAction={() => navigation.navigate('EmergencyEnd')}
    >
      <View style={[styles.top, { paddingTop: insets.top + spacing.xxl }]}>
        <AppText variant="label" style={styles.soft}>
          {session?.task?.text ?? 'Session'}
        </AppText>
        <AppText variant="micro" style={styles.faint}>
          {session
            ? `${formatClock(session.slot.start)} – ${formatClock(
                session.slot.start + active.minutes,
              )}`
            : ''}
        </AppText>
      </View>

      <View style={styles.middle}>
        <Animated.View entering={FadeIn.duration(motion.cinematic)}>
          <FocusDial elapsed={elapsed} total={total}>
            <AppText style={styles.time} testID="session-remaining">
              {`${mm}:${String(ss).padStart(2, '0')}`}
            </AppText>
            <AppText variant="micro" style={styles.faint}>
              {`left of ${active.minutes} min`}
            </AppText>
          </FocusDial>
        </Animated.View>

        <View style={styles.readout}>
          <AppText style={styles.stageName}>{STAGES[stage].name}</AppText>
          <View style={styles.stages}>
            {STAGES.map((st, i) => (
              <StageBox
                key={st.from}
                state={i < stage ? 'done' : i === stage ? 'now' : 'ahead'}
                fill={i === stage ? inStage : 0}
              />
            ))}
          </View>
          <AppText style={styles.line}>{STAGES[stage].line}</AppText>
        </View>
      </View>

      <AppText
        variant="micro"
        style={[styles.faint, { marginBottom: insets.bottom + 28 }]}
      >
        Hold anywhere to end early · Dims in 5 s
      </AppText>

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
  },
  soft: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  faint: {
    color: 'rgba(255, 255, 255, 0.28)',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  readout: {
    marginTop: 36,
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontFamily: fonts.sansBold,
    fontSize: 58,
    lineHeight: 64,
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
  veil: {
    backgroundColor: '#000',
  },
});
