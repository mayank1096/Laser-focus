import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { formatClock } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { planFor, usePlanning } from '../planning/store';
import { STAGES } from './ritual/content';
import { useSessions } from './store';

/** The screen dims this long after the last touch. */
const DIM_AFTER = 5000;
const SIZE = 340;
const C = SIZE / 2;
const RADII = [160, 128, 96, 64, 32];

/**
 * During a session the phone is mostly dark. When woken, it shows the
 * aperture: five rings for the course's attention stages, closing in on
 * the eye as focus deepens. Hold anywhere to end early.
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

  // Rings: outer = first minutes. Passed rings fade, the current one carries
  // the light, the ones ahead wait dotted.
  const r = RADII[Math.min(stage, RADII.length - 1)];
  const a = inStage * 2 * Math.PI;
  const x = C + r * Math.sin(a);
  const y = C - r * Math.cos(a);

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

      <Animated.View
        entering={FadeIn.duration(motion.cinematic)}
        style={styles.aperture}
      >
        <Svg width={SIZE} height={SIZE}>
          {RADII.map((rad, i) => (
            <Circle
              key={rad}
              cx={C}
              cy={C}
              r={rad}
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity={
                i < stage
                  ? 0.05
                  : i === stage
                  ? 0.12
                  : i === RADII.length - 1
                  ? 0.22
                  : 0.16
              }
              strokeWidth={1}
              strokeDasharray={
                i > stage && i < RADII.length - 1 ? '1 5' : undefined
              }
              strokeLinecap="round"
            />
          ))}
          {stage < RADII.length ? (
            <Path
              d={`M${C} ${C - r} A${r} ${r} 0 ${
                inStage > 0.5 ? 1 : 0
              } 1 ${x} ${y}`}
              fill="none"
              stroke={colors.saffron}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : null}
          <Circle
            cx={x}
            cy={y}
            r={10}
            fill={colors.saffron}
            fillOpacity={0.16}
          />
          <Circle cx={x} cy={y} r={3.5} fill={colors.saffron} />
          <Circle
            cx={C}
            cy={C}
            r={stage === RADII.length - 1 ? 5 : 3}
            fill={stage === RADII.length - 1 ? colors.saffron : '#FFFFFF'}
            fillOpacity={stage === RADII.length - 1 ? 1 : 0.35}
          />
        </Svg>
        {STAGES.slice(1).map((s, i) => (
          <AppText
            key={s.from}
            variant="micro"
            style={[
              styles.mark,
              i + 1 <= stage ? styles.markPassed : styles.markAhead,
              { top: C - RADII[i + 1] - 16 },
            ]}
          >
            {String(s.from)}
          </AppText>
        ))}
      </Animated.View>

      <View style={styles.readout}>
        <AppText style={styles.time} testID="session-remaining">
          {`${mm}:${String(ss).padStart(2, '0')}`}
        </AppText>
        <AppText variant="micro" style={styles.faint}>
          {`left of ${active.minutes} min`}
        </AppText>
        <AppText variant="eyebrow" style={styles.stage}>
          {`Stage ${stage + 1} of ${STAGES.length} · ${STAGES[stage].name}`}
        </AppText>
        <AppText style={styles.line}>{STAGES[stage].line}</AppText>
      </View>

      <AppText
        variant="micro"
        style={[
          styles.faint,
          styles.exit,
          { marginBottom: insets.bottom + 28 },
        ]}
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
  aperture: {
    marginTop: 40,
    width: SIZE,
    height: SIZE,
  },
  mark: {
    position: 'absolute',
    left: C + 6,
  },
  markPassed: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  markAhead: {
    color: 'rgba(255, 255, 255, 0.22)',
  },
  readout: {
    marginTop: 28,
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    ...typography.display,
    fontSize: 56,
    lineHeight: 60,
    color: 'rgba(255, 255, 255, 0.82)',
  },
  stage: {
    marginTop: spacing.xl,
    color: colors.saffron,
  },
  line: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: spacing.sm,
  },
  exit: {
    marginTop: 'auto',
  },
  veil: {
    backgroundColor: '#000',
  },
});
