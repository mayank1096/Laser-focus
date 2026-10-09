import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

/** How long the petals take to burst, hang and settle out of sight. */
const DURATION = 4400;
/** Thrown up from the card, and let fall from above the screen. */
const THROWN = 30;
const SHOWERED = 26;
/** How quickly the burst slows, and how fast a petal drifts down after. */
const DRAG = 2.6;

/** Marigold in three shades, and a few rose petals among them. */
const MARIGOLD = ['#FFB21E', '#FA8C22', '#F26B0F', '#FFC94D'];
const ROSE = '#C8102E';

/** A fixed scatter, so every shower falls the same way and renders stay pure. */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Petal = {
  /** Falls from above the screen instead of bursting from the card. */
  fromAbove: boolean;
  /** Seconds before it appears. */
  delay: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  fall: number;
  sway: number;
  swayRate: number;
  phase: number;
  spin: number;
  flip: number;
  size: number;
  colour: string;
};

const PETALS: Petal[] = Array.from({ length: THROWN + SHOWERED }, (_, i) => {
  const fromAbove = i >= THROWN;
  // Thrown ones go mostly upward, fanned out to both sides.
  const angle = -Math.PI / 2 + (rand(i, 1) - 0.5) * 2.4;
  const speed = fromAbove ? 0 : 520 + rand(i, 2) * 620;
  return {
    fromAbove,
    delay: fromAbove ? 0.25 + rand(i, 11) * 1.1 : 0,
    x0: fromAbove ? rand(i, 3) : (rand(i, 3) - 0.5) * 0.8,
    y0: fromAbove ? -20 - rand(i, 12) * 120 : 0,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    fall: 55 + rand(i, 4) * 70,
    sway: 10 + rand(i, 5) * 22,
    swayRate: 2 + rand(i, 6) * 3,
    phase: rand(i, 7) * Math.PI * 2,
    spin: (rand(i, 8) - 0.5) * 540,
    flip: 3 + rand(i, 9) * 6,
    size: 10 + rand(i, 10) * 10,
    colour: i % 9 === 4 ? ROSE : MARIGOLD[i % MARIGOLD.length],
  };
});

/**
 * Phool barsana: a handful of marigold and rose petals thrown up from the
 * card, the way they're showered on someone who has done something worth
 * honouring. Some burst from the card, slow and hang; more drift down from
 * above. All flutter as they fall, turning over as they go. Each `fire`
 * throws a new handful.
 */
export const MarigoldShower = memo(function Shower({
  fire,
  x,
  y,
  spread,
  width,
}: {
  /** Bump to throw petals; 0 throws none. */
  fire: number;
  /** Where they're thrown from, in this view's coordinates. */
  x: number;
  y: number;
  /** How wide the throw is, usually the card's width. */
  spread: number;
  /** The screen's width, for the petals falling from above. */
  width: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    if (fire > 0) {
      t.value = 0;
      t.value = withTiming(DURATION / 1000, {
        duration: DURATION,
        easing: Easing.linear,
      });
    }
  }, [fire, t]);
  if (fire === 0) {
    return null;
  }
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PETALS.map((p, i) => (
        <PetalView
          key={`${fire}-${i}`}
          petal={p}
          t={t}
          x={p.fromAbove ? p.x0 * width : x + p.x0 * spread}
          y={p.fromAbove ? p.y0 : y}
        />
      ))}
    </View>
  );
});

const PetalView = memo(function Petal({
  petal: p,
  t,
  x,
  y,
}: {
  petal: Petal;
  t: SharedValue<number>;
  x: number;
  y: number;
}) {
  const style = useAnimatedStyle(() => {
    const s = t.value - p.delay;
    const slowed = (1 - Math.exp(-DRAG * s)) / DRAG;
    const end = DURATION / 1000;
    return {
      // Fade on the shower's own clock, so late petals are gone by the end
      // instead of freezing mid-air when the timing stops.
      opacity:
        s <= 0 ? 0 : Math.min(1, s / 0.06, Math.max(0, (end - t.value) / 0.9)),
      transform: [
        {
          translateX:
            x + p.vx * slowed + p.sway * Math.sin(p.swayRate * s + p.phase),
        },
        { translateY: y + p.vy * slowed + p.fall * (s - slowed) * 2.2 },
        { rotate: `${p.spin * s}deg` },
        // Turning over as it falls: the petal narrows, then shows its back.
        { scaleY: 0.25 + 0.75 * Math.abs(Math.cos(p.flip * s + p.phase)) },
        { scale: p.fromAbove ? 1 : Math.min(1, Math.max(0, s) / 0.12) },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.petal,
        {
          width: p.size,
          height: p.size * 1.4,
          marginLeft: -p.size / 2,
          // A leaf of a petal: two round corners, two pointed.
          borderTopLeftRadius: p.size,
          borderBottomRightRadius: p.size,
          backgroundColor: p.colour,
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  petal: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderTopRightRadius: 2,
    borderBottomLeftRadius: 2,
  },
});
