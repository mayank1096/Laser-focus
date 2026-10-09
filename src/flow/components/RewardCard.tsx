import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import Check from '../../assets/icons/check.svg';
import { AppText } from '../../components/AppText';
import { ShaderView } from '../../components/shader';
import type { Mark } from '../../core/model';
import { colors, fonts, springs, typography } from '../../theme';
import { haptics } from '../../utils/haptics';
import { FILL_MS, SaffronFill, zigzag } from './MarkBox';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const RADIUS = 28;

/**
 * The reward. The card spins in like a game drop, face down first, and
 * lands face up on a warm glow. Hold it and it fills with saffron while the
 * phone ticks faster and harder; let go early and it drains. Swipe across
 * it for the zig-zag. Once it's full it pops, and the glow flares.
 */
export function RewardCard({
  width,
  eyebrow,
  title,
  outcome,
  brand,
  holdLabel,
  fill,
  zig,
  locked,
  fullLabel,
  halfLabel,
  onMark,
}: {
  width: number;
  eyebrow: string;
  title: string;
  outcome: string;
  /** Printed on the card's back. */
  brand: string;
  /** The word inside the dashed ring: "Hold". */
  holdLabel: string;
  fill: SharedValue<number>;
  zig: SharedValue<number>;
  locked: boolean;
  /** What a screen reader offers in place of the hold and the swipe. */
  fullLabel: string;
  halfLabel: string;
  onMark: (mark: Exclude<Mark, 'empty'>) => void;
}) {
  const height = Math.round(width * 1.32);
  const glowSize = width * 1.9;
  const done = useRef(locked);
  done.current = locked;
  const ticks = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The drop: one and a half turns, rising and settling.
  const spin = useSharedValue(locked ? 0 : 1);
  const arrive = useSharedValue(locked ? 1 : 0);
  const press = useSharedValue(1);
  const flare = useSharedValue(0);
  const breathe = useSharedValue(0);
  useEffect(() => {
    if (!locked) {
      // Wait for the screen to settle, then drop the card in.
      arrive.value = withDelay(
        350,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
      );
      spin.value = withDelay(
        350,
        withTiming(0, {
          duration: 1900,
          easing: Easing.bezier(0.3, 0.1, 0.2, 1),
        }),
      );
      const land = setTimeout(() => haptics.confirm(), 2100);
      return () => clearTimeout(land);
    }
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [breathe]);

  const stopTicks = () => {
    if (ticks.current) {
      clearTimeout(ticks.current);
      ticks.current = null;
    }
  };
  useEffect(() => stopTicks, []);

  // The phone ticks while the card fills: gentle at first, harder and
  // quicker as it nears the top.
  const startTicks = () => {
    const began = Date.now();
    const beat = () => {
      const p = Math.min(1, (Date.now() - began) / FILL_MS);
      if (p < 0.45) {
        haptics.selection();
      } else if (p < 0.8) {
        haptics.tap();
      } else {
        haptics.confirm();
      }
      ticks.current = setTimeout(beat, 170 - p * 100);
    };
    beat();
  };

  const celebrate = () => {
    flare.value = withSequence(
      withTiming(1, { duration: 260 }),
      withTiming(0, { duration: 1200 }),
    );
    press.value = withSequence(
      withTiming(1.06, { duration: 160 }),
      withSpring(1, springs.morph),
    );
  };

  const hold = Gesture.LongPress()
    .runOnJS(true)
    .minDuration(FILL_MS)
    .maxDistance(16)
    .onBegin(() => {
      if (done.current) {
        return;
      }
      press.value = withTiming(0.97, { duration: 200 });
      zig.value = withTiming(0, { duration: 150 });
      fill.value = withTiming(1, {
        duration: FILL_MS * (1 - fill.value),
        easing: Easing.bezier(0.33, 0, 0.67, 1),
      });
      stopTicks();
      startTicks();
    })
    .onStart(() => {
      if (done.current) {
        return;
      }
      stopTicks();
      fill.value = 1;
      haptics.success();
      haptics.heavy();
      celebrate();
      onMark('full');
    })
    .onFinalize((_e, success) => {
      stopTicks();
      if (!success && !done.current) {
        press.value = withSpring(1, springs.snappy);
        fill.value = withTiming(0, { duration: 400 });
      }
    });

  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-14, 14])
    .onUpdate(e => {
      if (done.current) {
        return;
      }
      fill.value = 0;
      zig.value = Math.min(1, Math.abs(e.translationX) / (width * 0.7));
    })
    .onEnd(() => {
      if (done.current) {
        return;
      }
      if (zig.value > 0.6) {
        zig.value = withTiming(1, { duration: 150 });
        haptics.success();
        celebrate();
        onMark('half');
      } else {
        zig.value = withTiming(0, { duration: 250 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    opacity: arrive.value,
    transform: [
      { perspective: 900 },
      { translateY: (1 - arrive.value) * 40 },
      { scale: (0.72 + arrive.value * 0.28) * press.value },
    ],
  }));
  // Front and back turn together; each hides when it faces away.
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${spin.value * 540}deg` }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${spin.value * 540 + 180}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: arrive.value * (0.55 + breathe.value * 0.2 + flare.value * 0.4),
    transform: [
      {
        scale:
          0.85 + breathe.value * 0.08 + fill.value * 0.12 + flare.value * 0.3,
      },
    ],
  }));
  const fillStyle = useAnimatedStyle(() => ({
    height: `${fill.value * 100}%`,
  }));
  const inkStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      fill.value,
      [0.45, 0.75],
      [colors.ink, colors.white],
    ),
  }));
  const softInkStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      fill.value,
      [0.15, 0.4],
      [colors.textMuted, 'rgba(255, 255, 255, 0.85)'],
    ),
  }));
  // The invitation: a dashed ring that breathes until the card fills.
  const targetStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value + zig.value, [0, 0.3], [1, 0], 'clamp'),
    transform: [{ scale: 0.94 + breathe.value * 0.08 }],
  }));
  const tickStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fill.value, [0.9, 1], [0, 1], 'clamp'),
    transform: [
      { scale: interpolate(fill.value, [0.9, 1], [0.4, 1], 'clamp') },
    ],
  }));
  const { points, length } = zigzag(width, height);
  const zigProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - zig.value),
    strokeOpacity: zig.value > 0.001 ? 1 : 0,
  }));
  const washStyle = useAnimatedStyle(() => ({ opacity: zig.value }));

  return (
    <View style={[styles.stage, { height: height + 40 }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            left: (width - glowSize) / 2,
            top: (height - glowSize) / 2 + 20,
          },
          glowStyle,
        ]}
      >
        <ShaderView
          preset="glow"
          width={glowSize}
          height={glowSize}
          colours={['#F9C08A', '#FA8C22', '#FFE1C2']}
        />
      </Animated.View>

      <GestureDetector gesture={Gesture.Race(swipe, hold)}>
        <Animated.View
          collapsable={false}
          testID="mark-pad"
          accessibilityRole="button"
          accessibilityLabel={`${eyebrow}, ${title}`}
          accessibilityActions={
            locked
              ? []
              : [
                  { name: 'activate', label: fullLabel },
                  { name: 'half', label: halfLabel },
                ]
          }
          onAccessibilityAction={e => {
            if (done.current) {
              return;
            }
            const full = e.nativeEvent.actionName === 'activate';
            fill.value = withTiming(full ? 1 : 0, { duration: 400 });
            zig.value = withTiming(full ? 0 : 1, { duration: 400 });
            haptics.success();
            celebrate();
            onMark(full ? 'full' : 'half');
          }}
          style={[{ width, height }, cardStyle]}
        >
          {/* Back: shown only while the card spins in. */}
          <Animated.View style={[styles.face, styles.back, backStyle]}>
            <SaffronFill id="reward-back" />
            <View style={styles.backRing} />
            <Animated.Text style={styles.backBrand}>{brand}</Animated.Text>
          </Animated.View>

          {/* Front */}
          <Animated.View style={[styles.face, styles.front, frontStyle]}>
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.wash, washStyle]}
            />
            <Animated.View style={[styles.fill, fillStyle]}>
              <SaffronFill id="reward-fill" />
            </Animated.View>
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
              <AnimatedPolyline
                points={points}
                fill="none"
                stroke={colors.saffron}
                strokeWidth={10}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={`${length} ${length}`}
                animatedProps={zigProps}
              />
            </Svg>
            <View style={styles.copy} pointerEvents="none">
              <Animated.Text style={[styles.eyebrow, softInkStyle]}>
                {eyebrow}
              </Animated.Text>
              <Animated.Text style={[styles.title, inkStyle]} numberOfLines={3}>
                {title}
              </Animated.Text>
              <Animated.Text
                style={[styles.outcome, softInkStyle]}
                numberOfLines={3}
              >
                {outcome}
              </Animated.Text>
            </View>
            <Animated.View
              style={[styles.tick, targetStyle]}
              pointerEvents="none"
            >
              <View style={styles.target}>
                <AppText variant="label" style={styles.targetText}>
                  {holdLabel}
                </AppText>
              </View>
            </Animated.View>
            <Animated.View
              style={[styles.tick, tickStyle]}
              pointerEvents="none"
            >
              <View style={styles.tickDisc}>
                <Check
                  width={34}
                  height={34}
                  color={colors.saffron}
                  strokeWidth={2.8}
                />
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  face: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  front: {
    justifyContent: 'flex-end',
    backgroundColor: colors.white,
    boxShadow: '0px 24px 48px rgba(122, 52, 12, 0.18)',
  },
  back: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRing: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: RADIUS - 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  backBrand: {
    ...typography.eyebrow,
    color: colors.white,
  },
  wash: {
    backgroundColor: 'rgba(250, 140, 34, 0.12)',
  },
  fill: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  copy: {
    ...StyleSheet.absoluteFill,
    padding: 24,
    gap: 10,
  },
  eyebrow: {
    ...typography.eyebrow,
  },
  title: {
    ...typography.title,
    fontSize: 26,
    lineHeight: 30,
  },
  outcome: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
  },
  tick: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 70,
  },
  target: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.saffron,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 140, 34, 0.06)',
  },
  targetText: {
    color: colors.saffron,
  },
  tickDisc: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    boxShadow: '0px 10px 24px rgba(122, 52, 12, 0.22)',
  },
});
