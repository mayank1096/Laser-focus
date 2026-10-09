import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Check from '../../assets/icons/check.svg';
import { AppText } from '../../components/AppText';
import { rise } from '../../components/QuestionHeader';
import { colors, motion, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';
import { BreathOrb } from './BreathOrb';
import { useT } from '../../i18n';

/* ------------------------------------------------------------------------ */
/* 7.01 Enter                                                                */
/* ------------------------------------------------------------------------ */

export function EnterStep({
  when,
  task,
  outcome,
  challenge,
}: {
  when: string;
  task: string;
  outcome: string;
  challenge?: string;
}) {
  const t = useT();
  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {when}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        {t.ritual.enterTitle}
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={typography.body}>
        {t.ritual.enterSub}
      </Animated.Text>
      <Animated.View entering={rise(3)} style={styles.sheet}>
        <AppText variant="eyebrow">{task}</AppText>
        <AppText variant="heading" style={styles.outcome}>
          {outcome}
        </AppText>
        {challenge ? (
          <View style={styles.inline}>
            <AppText variant="micro" style={styles.saffron}>
              {t.ritual.challenge}
            </AppText>
            <AppText variant="micro" style={[styles.muted, styles.flex]}>
              {challenge}
            </AppText>
          </View>
        ) : null}
      </Animated.View>
      <Animated.View entering={rise(4)} style={styles.steps}>
        {t.ritual.steps.map(s => (
          <View key={s} style={styles.step}>
            <View style={styles.stepDot} />
            <AppText variant="micro" style={styles.muted}>
              {s}
            </AppText>
          </View>
        ))}
      </Animated.View>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* 7.02 Clear the field                                                      */
/* ------------------------------------------------------------------------ */

export function ClearStep({
  failureModes,
  ticked,
  onToggle,
}: {
  failureModes: string[];
  ticked: Set<string>;
  onToggle: (item: string) => void;
}) {
  const t = useT();
  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {t.ritual.clearEyebrow}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        {t.ritual.clearTitle}
      </Animated.Text>
      {failureModes.length ? (
        <Animated.View entering={rise(2)} style={styles.pinned}>
          <AppText variant="eyebrow">{t.ritual.sinkYou}</AppText>
          <AppText variant="bodyMedium">{failureModes.join('  ·  ')}</AppText>
        </Animated.View>
      ) : null}
      {t.ritual.checklist.map((g, gi) => (
        <Animated.View
          key={g.group}
          entering={rise(3 + gi)}
          style={styles.group}
        >
          <AppText variant="eyebrow" style={styles.faint}>
            {g.group}
          </AppText>
          <View style={styles.card}>
            {g.items.map((item, i) => {
              const on = ticked.has(item);
              return (
                <Pressable
                  key={item}
                  testID={`check-${item}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    haptics.selection();
                    onToggle(item);
                  }}
                  style={[
                    styles.item,
                    i < g.items.length - 1 && styles.divider,
                  ]}
                >
                  <View style={[styles.box, on && styles.boxOn]}>
                    {on ? (
                      <Animated.View entering={FadeIn.duration(motion.fast)}>
                        <Check
                          width={11}
                          height={11}
                          color={colors.white}
                          strokeWidth={3}
                        />
                      </Animated.View>
                    ) : null}
                  </View>
                  <AppText variant="body" style={on ? styles.muted : null}>
                    {item}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      ))}
    </>
  );
}

/** Every item on the checklist must be ticked before the next step. */
export const checklistCount = (groups: { items: string[] }[]) =>
  groups.reduce((n, g) => n + g.items.length, 0);

/* ------------------------------------------------------------------------ */
/* 7.03 Breathe                                                              */
/* ------------------------------------------------------------------------ */

const PHASES = [
  { word: 'breatheIn', seconds: 4, to: 1 },
  { word: 'hold', seconds: 4, to: 0.96 },
  { word: 'breatheOut', seconds: 6, to: 0 },
] as const;
const BREATHS = 3;

export function BreatheStep({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [breath, setBreath] = useState(0);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState<number>(PHASES[0].seconds);
  const level = useSharedValue(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const p = PHASES[phase];
    setLeft(p.seconds);
    if (phase === 0) {
      haptics.pattern.breath();
    } else {
      haptics.tap();
    }
    // Even, controlled breaths: a slow start, a steady middle, a soft
    // arrival. Hold barely moves, like lungs resting full.
    level.value = withTiming(p.to, {
      duration: p.seconds * 1000,
      easing: Easing.bezier(0.42, 0, 0.58, 1),
    });
    const tick = setInterval(() => setLeft(l => Math.max(1, l - 1)), 1000);
    const next = setTimeout(() => {
      if (phase < PHASES.length - 1) {
        setPhase(phase + 1);
      } else if (breath < BREATHS - 1) {
        setBreath(breath + 1);
        setPhase(0);
      } else {
        done.current();
      }
    }, p.seconds * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(next);
    };
  }, [phase, breath, level]);

  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {t.ritual.breathe(breath + 1, BREATHS)}
      </Animated.Text>
      <Animated.View
        entering={FadeIn.delay(200).duration(motion.cinematic)}
        style={styles.breath}
        accessibilityLiveRegion="polite"
      >
        <BreathOrb
          level={level}
          label={t.ritual[PHASES[phase].word]}
          sub={String(left)}
        />
      </Animated.View>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* 7.04 Prayer                                                               */
/* ------------------------------------------------------------------------ */

export function PrayStep({ index }: { index: number }) {
  const t = useT();
  const prayers = t.ritual.prayers;
  const p = prayers[index];
  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {t.ritual.pray(index + 1, prayers.length)}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        {t.ritual.prayTitle}
      </Animated.Text>
      <Animated.View
        key={index}
        entering={FadeInDown.duration(motion.slow)}
        style={styles.prayer}
      >
        <AppText variant="eyebrow" style={styles.saffron}>
          {p.name}
        </AppText>
        <AppText style={styles.shloka}>{p.text}</AppText>
        <AppText variant="caption" style={styles.center}>
          {p.meaning}
        </AppText>
      </Animated.View>
      <View style={styles.dots}>
        {prayers.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotOn]} />
        ))}
      </View>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* 7.05 Values                                                               */
/* ------------------------------------------------------------------------ */

const LINE_EVERY = 1400;

export function ValuesStep({
  lines,
  onAllShown,
}: {
  lines: string[];
  onAllShown: () => void;
}) {
  const t = useT();
  const [shown, setShown] = useState(1);
  const cb = useRef(onAllShown);
  cb.current = onAllShown;
  useEffect(() => {
    if (shown >= lines.length) {
      cb.current();
      return;
    }
    const t = setTimeout(() => setShown(s => s + 1), LINE_EVERY);
    return () => clearTimeout(t);
  }, [shown, lines.length]);

  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {t.ritual.valuesEyebrow}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        {t.ritual.valuesTitle}
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={typography.body}>
        {t.ritual.valuesSub}
      </Animated.Text>
      <View style={styles.values}>
        {lines.slice(0, shown).map(l => (
          <Animated.View
            key={l}
            entering={FadeInDown.duration(motion.slow).easing(motion.easeOut)}
            style={styles.value}
          >
            <AppText variant="body" style={styles.center}>
              {l}
            </AppText>
          </Animated.View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  sheet: {
    marginTop: spacing.xxl,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  outcome: {
    fontSize: 17,
  },
  inline: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  saffron: {
    color: colors.saffron,
  },
  muted: {
    color: colors.textMuted,
  },
  faint: {
    color: colors.textFaint,
  },
  steps: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  pinned: {
    gap: spacing.sm,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.blush,
  },
  group: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  breath: {
    marginTop: 48,
  },
  white: {
    color: colors.white,
  },
  center: {
    textAlign: 'center',
  },
  prayer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: 26,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: colors.parchment,
  },
  shloka: {
    fontSize: 18,
    lineHeight: 30,
    textAlign: 'center',
    color: colors.ink,
  },
  dots: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotOn: {
    width: 18,
    backgroundColor: colors.saffron,
  },
  values: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  value: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
});
