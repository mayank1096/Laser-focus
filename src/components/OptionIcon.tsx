import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import { colors, motion } from '../theme';

export type IconComponent = React.FC<SvgProps>;

/**
 * The icon beside an option: a plain line icon, no tile. When the option
 * becomes active it turns saffron and gives one small hop and tilt, like a
 * nod.
 */
export function OptionIcon({
  Icon,
  active,
  size = 20,
}: {
  Icon: IconComponent;
  active: boolean;
  size?: number;
}) {
  const on = useSharedValue(active ? 1 : 0);
  const hop = useSharedValue(0);
  const tilt = useSharedValue(0);

  useEffect(() => {
    on.value = withTiming(active ? 1 : 0, { duration: motion.base });
    if (active) {
      hop.value = withSequence(
        withTiming(-5, { duration: 120 }),
        withSpring(0, { damping: 8, stiffness: 260 }),
      );
      tilt.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(8, { duration: 120 }),
        withSpring(0, { damping: 10, stiffness: 220 }),
      );
    }
  }, [active, on, hop, tilt]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hop.value },
      { rotate: `${tilt.value}deg` },
      { scale: 1 + on.value * 0.08 },
    ],
  }));

  return (
    <Animated.View style={iconStyle}>
      <Icon
        width={size}
        height={size}
        color={active ? colors.saffron : 'rgba(0, 0, 0, 0.45)'}
        strokeWidth={1.6}
      />
    </Animated.View>
  );
}
