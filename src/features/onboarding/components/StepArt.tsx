import React, { useEffect } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { layout, motion } from '../../../theme';

/** Size of the illustration in the 402pt-wide Figma frames. */
const DESIGN_SIZE = 557;
/** How far the art recedes when content runs over it. */
const DIMMED_OPACITY = 0.14;

/** On-screen size of the illustration for this device width. */
export function useArtSize() {
  const { width } = useWindowDimensions();
  return DESIGN_SIZE * (width / layout.designWidth);
}

/**
 * The warrior illustration anchored to the bottom of the screen. When the
 * art changes between steps the old one dissolves into the new one; when a
 * long list reaches it, it fades back so text stays readable.
 */
export function StepArt({
  source,
  artKey,
  dimmed = false,
}: {
  source: ImageSourcePropType;
  artKey: string;
  dimmed?: boolean;
}) {
  const { width } = useWindowDimensions();
  const size = useArtSize();
  const opacity = useSharedValue(dimmed ? DIMMED_OPACITY : 1);

  useEffect(() => {
    opacity.value = withTiming(dimmed ? DIMMED_OPACITY : 1, {
      duration: motion.slow,
    });
  }, [dimmed, opacity]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.art,
        { width: size, height: size, left: (width - size) / 2 },
        fadeStyle,
      ]}
    >
      <Animated.Image
        key={artKey}
        source={source}
        entering={FadeIn.duration(motion.cinematic).easing(motion.easeOut)}
        exiting={FadeOut.duration(motion.cinematic)}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  art: {
    position: 'absolute',
    bottom: 0,
  },
});
