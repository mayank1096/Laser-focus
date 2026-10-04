import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Check from '../../../assets/icons/check.svg';
import { AppText } from '../../../components/AppText';
import { rise } from '../../../components/QuestionHeader';
import type { SessionSheet } from '../../../types/models';
import { colors, motion, spacing, typography } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { CHECKLIST, PRAYERS, RITUAL_STEPS } from './content';

/* ------------------------------------------------------------------------ */
/* 7.01 Enter                                                                */
/* ------------------------------------------------------------------------ */

export function EnterStep({
  when,
  task,
  sheet,
}: {
  when: string;
  task: string;
  sheet: SessionSheet;
}) {
  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {when}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        Pranam & enter.
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={typography.body}>
        Your corner is a temple. Enter it like one.
      </Animated.Text>
      <Animated.View entering={rise(3)} style={styles.sheet}>
        <AppText variant="eyebrow">{task}</AppText>
        <AppText variant="heading" style={styles.outcome}>
          {sheet.outcome}
        </AppText>
        {sheet.challenge ? (
          <View style={styles.inline}>
            <AppText variant="micro" style={styles.saffron}>
              Harder
            </AppText>
            <AppText variant="micro" style={styles.muted}>
              {sheet.challenge}
            </AppText>
          </View>
        ) : null}
      </Animated.View>
      <Animated.View entering={rise(4)} style={styles.steps}>
        {RITUAL_STEPS.map(s => (
          <View key={s} style={styles.step}>
            <View style={styles.stepDot} />
            <AppText variant="micro" style={styles.muted}>
              {s}
            </AppText>
          </View>
        ))}
      </Animated.View>
      <Animated.Text
        entering={rise(5)}
        style={[typography.caption, styles.note]}
      >
        About 5 minutes
      </Animated.Text>
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
  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        विघ्न सूची · Clear the field
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        Only the work in reach.
      </Animated.Text>
      {failureModes.length ? (
        <Animated.View entering={rise(2)} style={styles.pinned}>
          <AppText variant="eyebrow">You said these would sink you</AppText>
          <AppText variant="bodyMedium">{failureModes.join('  ·  ')}</AppText>
        </Animated.View>
      ) : null}
      {CHECKLIST.map((g, gi) => (
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

export const CHECKLIST_COUNT = CHECKLIST.reduce(
  (n, g) => n + g.items.length,
  0,
);

/* ------------------------------------------------------------------------ */
/* 7.03 Breathe                                                              */
/* ------------------------------------------------------------------------ */

const PHASES = [
  { word: 'Breathe in', seconds: 4, to: 1 },
  { word: 'Hold', seconds: 4, to: 1 },
  { word: 'Breathe out', seconds: 6, to: 0 },
];
const BREATHS = 3;

export function BreatheStep({ onDone }: { onDone: () => void }) {
  const [breath, setBreath] = useState(0);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(PHASES[0].seconds);
  const size = useSharedValue(0);
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
    size.value = withTiming(p.to, {
      duration: p.seconds * 1000,
      easing: Easing.inOut(Easing.sin),
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
  }, [phase, breath, size]);

  const orb = useAnimatedStyle(() => ({
    transform: [{ scale: 0.62 + size.value * 0.38 }],
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: 0.15 + size.value * 0.25,
    transform: [{ scale: 0.8 + size.value * 0.35 }],
  }));

  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {`Breathe · ${breath + 1} of ${BREATHS}`}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        Slow. Like a warrior monk.
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={typography.body}>
        Spine straight. Eyes closed. Follow the pulse.
      </Animated.Text>
      <View style={styles.breath} accessibilityLiveRegion="polite">
        <Animated.View style={[styles.halo, halo]} />
        <Animated.View style={[styles.orb, orb]} />
        <View style={styles.breathText}>
          <AppText variant="heading" style={styles.white}>
            {PHASES[phase].word}
          </AppText>
          <AppText variant="micro" style={styles.white}>
            {left}
          </AppText>
        </View>
      </View>
      <AppText variant="micro" style={[styles.center, styles.muted]}>
        In 4 · Hold 4 · Out 6
      </AppText>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* 7.04 Prayer                                                               */
/* ------------------------------------------------------------------------ */

export function PrayStep({ index }: { index: number }) {
  const p = PRAYERS[index];
  return (
    <>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {`Pray · ${index + 1} of ${PRAYERS.length}`}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        Fold your hands.
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
        {PRAYERS.map((_, i) => (
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
        Your values · read slowly
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.title]}
      >
        Arjuna didn’t lift the bow before he knew why.
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={typography.body}>
        Read what you wrote. Each line appears when you’re ready.
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
  note: {
    marginTop: spacing.xl,
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
    marginTop: 40,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(250, 140, 34, 0.25)',
  },
  orb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.saffron,
    backgroundImage:
      'radial-gradient(circle at 50% 40%, #FFC27A 0%, #FA8C22 70%)',
  },
  breathText: {
    alignItems: 'center',
    gap: spacing.xs,
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
