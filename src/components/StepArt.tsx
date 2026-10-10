import React, { useEffect, useRef } from 'react';
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
import { layout, motion } from '../theme';

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
 * The warrior illustration anchored to the bottom of the screen. It arrives
 * with its page, never after it; when the art changes between steps the old
 * one dissolves into the new one; when a long list reaches it, it fades back
 * so text stays readable.
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
  // Rises with the page itself, straight to the strength the content allows.
  const opacity = useSharedValue(0);
  // The first art is part of the page; only later changes cross-fade.
  const mounted = useRef(false);
  useEffect(() => {
    opacity.value = withTiming(dimmed ? DIMMED_OPACITY : 1, {
      duration: mounted.current ? motion.slow : motion.base,
    });
    mounted.current = true;
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
        entering={
          mounted.current
            ? FadeIn.duration(motion.slow).easing(motion.easeOut)
            : undefined
        }
        exiting={FadeOut.duration(motion.slow)}
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
