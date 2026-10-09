import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChevronLeft from '../../assets/icons/chevron-left.svg';
import { AppText } from '../../components/AppText';
import { IconButton } from '../../components/IconButton';
import { MistBackdrop } from '../../components/MistBackdrop';
import { colors, fonts, MIST, motion, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';
import { BreathOrb } from './BreathOrb';
import { useT } from '../../i18n';
import { RitualBar } from './RitualBar';

/* ------------------------------------------------------------------------ */
/* The dark frame for breathing and prayer                                  */
/* ------------------------------------------------------------------------ */

/**
 * Breathing and prayer happen on the haze too: the ritual bar and a way
 * back on top, the step in the middle, its buttons pinned below.
 */
export function DarkFrame({
  step,
  onBack,
  footer,
  children,
  testID,
}: {
  step: number;
  onBack: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.dark} testID={testID}>
      <MistBackdrop />
      <View style={[styles.frameTop, { paddingTop: insets.top + 4 }]}>
        <IconButton
          Icon={ChevronLeft}
          size={20}
          color={colors.white}
          testID="back-button"
          accessibilityLabel={useT().common.back}
          onPress={onBack}
        />
        <View style={styles.flex}>
          <RitualBar step={step} dark />
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.frameBody}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View key={step} entering={FadeIn.duration(motion.slow)}>
          {children}
        </Animated.View>
      </ScrollView>
      <View style={[styles.frameFoot, { paddingBottom: insets.bottom + 20 }]}>
        {footer}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------------ */
/* 7.06 Tratak                                                               */
/* ------------------------------------------------------------------------ */

const TRATAK_SECONDS = 45;

export function TratakStep({ onDone }: { onDone: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [left, setLeft] = useState(TRATAK_SECONDS);
  const level = useSharedValue(0.4);
  const dim = useSharedValue(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    // The orb breathes slowly, about one long breath every eight seconds.
    level.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.bezier(0.42, 0, 0.58, 1),
      }),
      -1,
      true,
    );
    // After a few seconds the screen dims, so the eyes go to the desk.
    dim.value = withDelay(4000, withTiming(1, { duration: 2000 }));
    const tick = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    const end = setTimeout(() => {
      haptics.confirm();
      done.current();
    }, TRATAK_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [level, dim]);

  const veil = useAnimatedStyle(() => ({ opacity: dim.value * 0.75 }));

  return (
    <View style={[styles.dark, { paddingTop: insets.top + spacing.lg }]}>
      <MistBackdrop />
      <View style={styles.pad}>
        <RitualBar step={5} dark />
        <Animated.Text
          entering={FadeIn.duration(motion.slow)}
          style={[typography.eyebrow, styles.dim, styles.gapTop]}
        >
          {t.ritual.tratak}
        </Animated.Text>
      </View>
      <Animated.View
        entering={FadeIn.delay(200).duration(motion.cinematic)}
        style={styles.centre}
      >
        {/* A full, slowly turning globe of embers: something steady to
            rest the eyes on before they go to the desk. */}
        <BreathOrb
          tone="dark"
          state="searching"
          speed={0.35}
          tint="#FFB066"
          level={level}
          label={t.ritual.lookAtWork}
          sub={`0:${String(left).padStart(2, '0')}`}
        />
      </Animated.View>
      <Pressable
        testID="tratak-skip"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => done.current()}
        style={[styles.bottom, { paddingBottom: insets.bottom + 36 }]}
      >
        <AppText variant="caption" style={styles.dim}>
          {t.ritual.tratakSkip}
        </AppText>
      </Pressable>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.veil, veil]}
      />
    </View>
  );
}

/* ------------------------------------------------------------------------ */
/* 7.07 Countdown                                                            */
/* ------------------------------------------------------------------------ */

/** Each number arrives, rests, and leaves this slowly. */
const COUNT_IN = 900;
const COUNT_HOLD = 500;
const COUNT_OUT = 700;

/**
 * Nothing but black and one word at a time: 3, 2, 1, then Jay Shree Ram.
 * Each rises a few points into place as it fades in, rests, then fades
 * as it drifts on up.
 */
export function CountdownStep({ onDone }: { onDone: () => void }) {
  const WORDS = useT().ritual.countdown;
  const [i, setI] = useState(0);
  const shown = useSharedValue(0);
  const leave = useSharedValue(0);
  const done = useRef(onDone);
  done.current = onDone;
  const last = i === WORDS.length - 1;

  useEffect(() => {
    shown.value = 0;
    leave.value = 0;
    if (last) {
      haptics.confirm();
    } else {
      haptics.heavy();
    }
    shown.value = withTiming(1, {
      duration: COUNT_IN,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    const out = setTimeout(() => {
      leave.value = withTiming(1, {
        duration: COUNT_OUT,
        easing: Easing.in(Easing.quad),
      });
    }, COUNT_IN + (last ? COUNT_HOLD * 2 : COUNT_HOLD));
    const next = setTimeout(
      () => (last ? done.current() : setI(i + 1)),
      COUNT_IN + (last ? COUNT_HOLD * 2 : COUNT_HOLD) + COUNT_OUT,
    );
    return () => {
      clearTimeout(out);
      clearTimeout(next);
    };
  }, [i, last, shown, leave]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.value * (1 - leave.value),
    transform: [
      { translateY: (1 - shown.value) * 10 - leave.value * 10 },
      { scale: 0.97 + shown.value * 0.03 },
    ],
  }));

  return (
    <View
      style={[styles.dark, styles.centre]}
      accessibilityLiveRegion="assertive"
    >
      <MistBackdrop />
      <Animated.Text style={[styles.word, last && styles.phrase, style]}>
        {WORDS[i]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: {
    flex: 1,
    backgroundColor: MIST[0],
  },
  flex: {
    flex: 1,
  },
  frameTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: spacing.gutter,
  },
  frameBody: {
    flexGrow: 1,
    paddingHorizontal: spacing.gutter,
    paddingTop: 36,
    paddingBottom: spacing.xxl,
  },
  frameFoot: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.md,
    gap: 14,
  },
  pad: {
    paddingHorizontal: spacing.gutter,
  },
  gapTop: {
    marginTop: 36,
  },
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  white: {
    color: colors.white,
  },
  soft: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  dim: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    ...typography.heading,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bottom: {
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
  },
  veil: {
    backgroundColor: '#000',
  },
  word: {
    fontFamily: fonts.sansMedium,
    fontSize: 44,
    lineHeight: 52,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  phrase: {
    fontSize: 26,
    lineHeight: 32,
  },
});
