import { SegmentedControl } from '../../components/SegmentedControl';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppText } from '../../components/AppText';
import { ShaderView } from '../../components/shader';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { formatMinutes } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { planFor, usePlanning } from '../planning/store';
import { lastResultFor, useSessions, type Finished } from './store';

const W = 402;
const EYE = { x: 201, y: 210 };
/** The light that blooms behind the eye when the arrow lands. */
const BLOOM = 160;
const TAIL = { x: 48, y: 364 };

function PiercedEye() {
  const flight = useSharedValue(0);
  const bloom = useSharedValue(0);
  useEffect(() => {
    flight.value = withDelay(
      250,
      withTiming(1, { duration: 650, easing: Easing.in(Easing.quad) }, done => {
        if (done) {
          scheduleOnRN(haptics.heavy);
        }
      }),
    );
    bloom.value = withDelay(
      880,
      withTiming(1, { duration: 900, easing: motion.easeOut }),
    );
  }, [flight, bloom]);

  const dx = EYE.x - TAIL.x;
  const dy = EYE.y - TAIL.y;
  const arrowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, flight.value * 3),
    transform: [
      { translateX: -dx * 0.6 * (1 - flight.value) },
      { translateY: -dy * 0.6 * (1 - flight.value) },
    ],
  }));
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: bloom.value,
    transform: [{ scale: 0.4 + bloom.value * 0.6 }],
  }));

  const L = Math.hypot(dx, dy);
  const ux = dx / L;
  const uy = dy / L;
  const px = -uy;
  const py = ux;
  const feathers = [4, 13, 22].map(k => {
    const bx = TAIL.x + ux * k;
    const by = TAIL.y + uy * k;
    return `M${bx - ux * 8 + px * 6} ${by - uy * 8 + py * 6} L${bx} ${by} L${
      bx - ux * 8 - px * 6
    } ${by - uy * 8 - py * 6}`;
  });

  return (
    <View style={styles.eye}>
      <Animated.View style={[styles.bloom, bloomStyle]}>
        <ShaderView
          preset="glow"
          width={BLOOM * 2}
          height={BLOOM * 2}
          colours={['#E25E00', '#FA8C22', '#FFC27A']}
        />
      </Animated.View>
      <Svg width={W} height={420} style={StyleSheet.absoluteFill}>
        {[150, 118, 86, 54].map((r, i) => (
          <Circle
            key={r}
            cx={EYE.x}
            cy={EYE.y}
            r={r}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.06 + i * 0.045}
            strokeWidth={1}
          />
        ))}
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, arrowStyle]}>
        <Svg width={W} height={420}>
          <Line
            x1={TAIL.x}
            y1={TAIL.y}
            x2={EYE.x - ux * 6}
            y2={EYE.y - uy * 6}
            stroke="#FFFFFF"
            strokeOpacity={0.9}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          {feathers.map(d => (
            <Path
              key={d}
              d={d}
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity={0.55}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          <Circle cx={EYE.x} cy={EYE.y} r={5} fill="#FFFFFF" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const CHOICES: { id: Finished; label: string }[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'partly', label: 'Partly' },
  { id: 'no', label: 'No' },
];

/** The target, pierced. Then an honest account of it, in one line. */
export function SessionDoneScreen({
  navigation,
  route,
}: RootScreenProps<'SessionDone'>) {
  const { date, slotId } = route.params;
  const insets = useSafeAreaInsets();
  const sessions = useSessions();
  const planning = usePlanning();
  const result = sessions.results[date]?.[slotId];
  const view = planFor(planning, date).sessions.find(s => s.slot.id === slotId);
  const last = lastResultFor(sessions, result?.taskId ?? null, date);
  const [finished, setFinished] = useState<Finished>('yes');
  const [note, setNote] = useState('');
  const today = Object.values(sessions.results[date] ?? {});

  const mark = () => {
    haptics.success();
    sessions.review(date, slotId, { finished, note: note.trim() || undefined });
    if (finished === 'yes') {
      navigation.replace('StreakMark', { date });
    } else {
      navigation.replace('ProblemFinder', { date, slotId });
    }
  };

  return (
    <View style={styles.screen}>
      <PiercedEye />
      <View style={styles.head}>
        <Animated.Text
          entering={FadeIn.delay(900).duration(motion.slow)}
          style={[typography.eyebrow, styles.dim]}
        >
          {`${formatMinutes(result?.minutes ?? 0)} · ${
            view?.task?.text ?? 'Session'
          }`}
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.delay(1000).duration(motion.slow)}
          style={styles.title}
        >
          Lakshya bhed.
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(1200).duration(motion.slow)}
          style={[typography.body, styles.dim]}
        >
          The target, pierced. Now be honest about it.
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(1300)
          .duration(motion.slow)
          .easing(motion.easeOut)}
        style={[styles.panel, { paddingBottom: insets.bottom + 26 }]}
      >
        <AppText variant="eyebrow">Did you finish it?</AppText>
        <AppText variant="heading" style={styles.outcome}>
          {view?.sheet?.outcome ?? view?.task?.text ?? ''}
        </AppText>
        <SegmentedControl
          segments={CHOICES}
          value={finished}
          onChange={setFinished}
          testIDPrefix="finished"
        />
        <AppText variant="eyebrow" style={styles.gap}>
          The result, in one line
        </AppText>
        <View style={styles.field}>
          <TextInput
            testID="result-note"
            value={note}
            onChangeText={setNote}
            placeholder="64/100 in 3 h 02"
            placeholderTextColor={colors.textGhost}
            selectionColor={colors.saffron}
            cursorColor={colors.saffron}
            style={[typography.body, styles.input]}
            maxLength={60}
          />
          {last?.note ? (
            <AppText
              variant="micro"
              style={styles.faint}
            >{`was ${last.note}`}</AppText>
          ) : null}
        </View>
        <View style={styles.footer}>
          <View style={styles.today}>
            <AppText variant="eyebrow" style={styles.faint}>
              Today
            </AppText>
            <View style={styles.dots}>
              {today.map(r => (
                <View
                  key={r.slotId}
                  style={[styles.dot, r.endedEarly && styles.dotHalf]}
                />
              ))}
            </View>
          </View>
          <Pressable
            testID="mark-it"
            accessibilityRole="button"
            onPress={mark}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <AppText style={styles.buttonText}>Mark it</AppText>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloom: {
    position: 'absolute',
    left: EYE.x - BLOOM,
    top: EYE.y - BLOOM,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.night,
  },
  eye: {
    height: 420,
  },
  head: {
    position: 'absolute',
    top: 390,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.sm,
  },
  dim: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  title: {
    ...typography.display,
    fontSize: 38,
    lineHeight: 42,
    color: colors.white,
  },
  panel: {
    marginTop: 'auto',
    paddingTop: 26,
    paddingHorizontal: spacing.gutter,
    gap: spacing.md,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.parchment,
  },
  outcome: {
    fontSize: 16,
  },
  gap: {
    marginTop: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
  },
  faint: {
    color: colors.textFaint,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.lg,
  },
  today: {
    gap: spacing.xs,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.saffron,
  },
  dotHalf: {
    opacity: 0.45,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: colors.night,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    ...typography.button,
  },
});
