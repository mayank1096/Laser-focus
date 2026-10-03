import React from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { layout, motion } from '../../../theme';

/** Size of the illustration in the 402pt-wide Figma frames. */
const DESIGN_SIZE = 557;

/**
 * The warrior illustration anchored to the bottom of the screen. When the
 * art changes between steps the old one dissolves into the new one.
 */
export function StepArt({
  source,
  artKey,
}: {
  source: ImageSourcePropType;
  artKey: string;
}) {
  const { width } = useWindowDimensions();
  const size = DESIGN_SIZE * (width / layout.designWidth);

  return (
    <Animated.Image
      key={artKey}
      source={source}
      entering={FadeIn.duration(motion.cinematic).easing(motion.easeOut)}
      exiting={FadeOut.duration(motion.cinematic)}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
      style={[
        styles.art,
        { width: size, height: size, left: (width - size) / 2 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  art: {
    position: 'absolute',
    bottom: 0,
  },
});
