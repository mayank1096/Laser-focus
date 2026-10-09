import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { ShaderView } from '../../components/shader';
import { motion } from '../../theme';
import { haptics } from '../../utils/haptics';

const W = 402;
const EYE = { x: 201, y: 210 };
/** The light that blooms behind the eye when the arrow lands. */
const BLOOM = 160;
const TAIL = { x: 48, y: 364 };

/** The target, pierced: an arrow flies in and a light blooms behind it. */
export function PiercedEye() {
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

const styles = StyleSheet.create({
  bloom: {
    position: 'absolute',
    left: EYE.x - BLOOM,
    top: EYE.y - BLOOM,
  },
  eye: {
    height: 420,
    width: W,
    alignSelf: 'center',
  },
});
