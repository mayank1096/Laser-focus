import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AppText } from '../../../components/AppText';
import { colors, motion, spacing, typography } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { RitualBar } from './RitualBar';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/* ------------------------------------------------------------------------ */
/* 7.06 Tratak                                                               */
/* ------------------------------------------------------------------------ */

const TRATAK_SECONDS = 45;

export function TratakStep({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [left, setLeft] = useState(TRATAK_SECONDS);
  const progress = useSharedValue(0);
  const dim = useSharedValue(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: TRATAK_SECONDS * 1000,
      easing: Easing.linear,
    });
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
  }, [progress, dim]);

  const R = 64;
  const L = 2 * Math.PI * R;
  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: L * (1 - progress.value),
  }));
  const veil = useAnimatedStyle(() => ({ opacity: dim.value * 0.75 }));

  return (
    <View style={[styles.dark, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.pad}>
        <RitualBar step={5} dark />
        <Animated.Text
          entering={FadeIn.duration(motion.slow)}
          style={[typography.eyebrow, styles.dim, styles.gapTop]}
        >
          Tratak
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(150).duration(motion.slow)}
          style={[typography.title, styles.white, styles.title]}
        >
          Look at your work.
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(300).duration(motion.slow)}
          style={[typography.body, styles.soft]}
        >
          Not at me. Three deep breaths, then stare at your desk until the
          screen wakes you.
        </Animated.Text>
      </View>
      <View style={styles.centre}>
        <Svg width={360} height={360} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="ember" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#E25E00" stopOpacity="0.38" />
              <Stop offset="1" stopColor="#E25E00" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={180} cy={180} r={180} fill="url(#ember)" />
          <Circle
            cx={180}
            cy={180}
            r={R}
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity={0.1}
            strokeWidth={2}
          />
          <AnimatedCircle
            cx={180}
            cy={180}
            r={R}
            fill="none"
            stroke={colors.saffron}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${L} ${L}`}
            animatedProps={arcProps}
            transform="rotate(-90 180 180)"
          />
        </Svg>
        <AppText style={styles.timer}>{`0:${String(left).padStart(
          2,
          '0',
        )}`}</AppText>
      </View>
      <Pressable
        testID="tratak-skip"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => done.current()}
        style={[styles.bottom, { paddingBottom: insets.bottom + 36 }]}
      >
        <AppText variant="caption" style={styles.dim}>
          The screen dims to save your eyes · tap to begin now
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

export function CountdownStep({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [n, setN] = useState(5);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    haptics.heavy();
    if (n === 0) {
      const t = setTimeout(() => done.current(), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN(n - 1), 1000);
    return () => clearTimeout(t);
  }, [n]);

  return (
    <View style={[styles.dark, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.pad}>
        <RitualBar step={6} dark />
      </View>
      <View style={styles.centre} accessibilityLiveRegion="assertive">
        {n > 0 ? (
          <Animated.Text
            key={n}
            entering={ZoomIn.duration(motion.base)}
            exiting={FadeOut.duration(motion.fast)}
            style={styles.number}
          >
            {n}
          </Animated.Text>
        ) : (
          <Animated.Text
            entering={FadeIn.duration(motion.slow)}
            style={[typography.display, styles.white, styles.jay]}
          >
            Jay Shree Ram.
          </Animated.Text>
        )}
        <View style={styles.count}>
          {[5, 4, 3, 2, 1].map(k => (
            <View
              key={k}
              style={[
                styles.countDot,
                k >= n && n > 0 ? styles.countOn : null,
                n === 0 && styles.countOn,
              ]}
            />
          ))}
        </View>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 40 }]}>
        <AppText variant="body" style={[styles.soft, styles.middle]}>
          Then the first tiny action. One line. One stroke.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: {
    flex: 1,
    backgroundColor: colors.night,
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
  number: {
    fontFamily: typography.display.fontFamily,
    fontSize: 168,
    lineHeight: 180,
    color: colors.saffron,
  },
  jay: {
    textAlign: 'center',
  },
  count: {
    marginTop: spacing.xxl,
    flexDirection: 'row',
    gap: 8,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countOn: {
    backgroundColor: colors.saffron,
  },
  middle: {
    textAlign: 'center',
  },
});
