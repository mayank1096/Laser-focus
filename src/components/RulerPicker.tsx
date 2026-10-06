import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, motion, spacing } from '../theme';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';

export interface RulerPickerProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Text in the pill above the ruler. Defaults to the number. */
  formatLabel?: (value: number) => string;
  accessibilityLabel?: string;
  testID?: string;
}

/** Distance between ticks, in points. */
const SPACING = 7;
const TALLEST = 47;
/** Tick heights moving away from the centre — the "wave" in the Figma. */
const HEIGHTS = [TALLEST, 29, 21, 13, 7];

/**
 * A horizontal ruler. Drag or fling it; it snaps to whole values, ticks swell
 * as they pass the centre line and every value change gives a haptic tick.
 */
export function RulerPicker({
  value,
  min,
  max,
  onChange,
  formatLabel = String,
  accessibilityLabel,
  testID,
}: RulerPickerProps) {
  const [width, setWidth] = useState(0);
  // Distance scrolled along the ruler, in points. 0 = `min`.
  const position = useSharedValue((value - min) * SPACING);
  const startPosition = useSharedValue(0);
  const maxPosition = (max - min) * SPACING;
  const [label, setLabel] = useState(value);
  // The last value this ruler reported itself, so echoes of our own
  // onChange do not yank the ruler around mid-drag.
  const lastReported = useRef(value);

  // Follow outside changes only (e.g. restoring a saved draft).
  useEffect(() => {
    if (value === lastReported.current) {
      return;
    }
    lastReported.current = value;
    position.value = withSpring((value - min) * SPACING, motion.spring);
    setLabel(value);
  }, [value, min, position]);

  const report = (next: number) => {
    lastReported.current = next;
    setLabel(next);
    haptics.selection();
    onChange(next);
  };

  useAnimatedReaction(
    () => Math.round(position.value / SPACING) + min,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        scheduleOnRN(report, Math.min(max, Math.max(min, current)));
      }
    },
  );

  const snap = () => {
    'worklet';
    const target = Math.round(position.value / SPACING) * SPACING;
    position.value = withSpring(
      Math.min(maxPosition, Math.max(0, target)),
      motion.pressSpring,
    );
  };

  const pan = usePanGesture({
    activeOffsetX: [-4, 4],
    failOffsetY: [-12, 12],
    onBegin: () => {
      'worklet';
      cancelAnimation(position);
      startPosition.value = position.value;
    },
    onUpdate: event => {
      'worklet';
      const next = startPosition.value - event.translationX;
      position.value = Math.min(maxPosition, Math.max(0, next));
    },
    onDeactivate: event => {
      'worklet';
      position.value = withDecay(
        {
          velocity: -event.velocityX,
          clamp: [0, maxPosition],
          deceleration: 0.994,
        },
        finished => {
          if (finished) {
            snap();
          }
        },
      );
    },
  });

  const tickCount = width > 0 ? Math.ceil(width / SPACING / 2) + 1 : 0;
  const offsets = Array.from(
    { length: tickCount * 2 + 1 },
    (_, i) => i - tickCount,
  );

  return (
    <View
      style={styles.container}
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: formatLabel(label) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => {
        const step = e.nativeEvent.actionName === 'increment' ? 1 : -1;
        const next = Math.min(max, Math.max(min, value + step));
        position.value = withSpring((next - min) * SPACING, motion.spring);
      }}
    >
      <ValuePill text={formatLabel(label)} />
      <GestureDetector gesture={pan}>
        <View
          style={styles.ruler}
          onLayout={(e: LayoutChangeEvent) =>
            setWidth(e.nativeEvent.layout.width)
          }
        >
          {offsets.map(offset => (
            <Tick
              key={offset}
              offset={offset}
              position={position}
              center={width / 2}
              totalTicks={max - min}
            />
          ))}
          <View style={[styles.indicator, { left: width / 2 - 1 }]} />
        </View>
      </GestureDetector>
    </View>
  );
}

function Tick({
  offset,
  position,
  center,
  totalTicks,
}: {
  offset: number;
  position: SharedValue<number>;
  center: number;
  totalTicks: number;
}) {
  const style = useAnimatedStyle(() => {
    const index = Math.floor(position.value / SPACING) + offset;
    const x = index * SPACING - position.value;
    const steps = Math.abs(x) / SPACING;
    const low = Math.floor(steps);
    const t = steps - low;
    const from = HEIGHTS[Math.min(low, HEIGHTS.length - 1)];
    const to = HEIGHTS[Math.min(low + 1, HEIGHTS.length - 1)];
    const height = from + (to - from) * t;
    return {
      opacity: index < 0 || index > totalTicks ? 0 : 1,
      transform: [{ translateX: center + x }, { scaleY: height / TALLEST }],
    };
  });

  return <Animated.View style={[styles.tick, style]} />;
}

function ValuePill({ text }: { text: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = 1.06;
    scale.value = withSpring(1, motion.pressSpring);
  }, [text, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.pill, style]}>
      <AppText variant="pickerValue">{text}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.xxl,
  },
  pill: {
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.saffron,
  },
  // 8pt of extra touch area above and below, without moving the ticks.
  ruler: {
    alignSelf: 'stretch',
    height: TALLEST + 16,
    marginVertical: -8,
    overflow: 'hidden',
  },
  tick: {
    position: 'absolute',
    top: 8,
    left: -0.5,
    width: 1,
    height: TALLEST,
    borderRadius: 1,
    backgroundColor: colors.tick,
  },
  indicator: {
    position: 'absolute',
    top: 8,
    width: 2,
    height: TALLEST,
    borderRadius: 1,
    backgroundColor: colors.saffron,
  },
});
