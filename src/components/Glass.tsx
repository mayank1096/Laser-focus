import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

let ids = 0;

/**
 * Smoked glass for cards on the haze: near-black at the top, warming to a
 * translucent amber at the foot so the light behind shows through. Lay it
 * as the first child of a card with `overflow: 'hidden'`.
 */
export function GlassFill() {
  const id = useRef(`glass-${++ids}`).current;
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#120B08" stopOpacity={0.94} />
          <Stop offset="0.55" stopColor="#2A140B" stopOpacity={0.82} />
          <Stop offset="1" stopColor="#B4521A" stopOpacity={0.55} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/** The hairline edge that catches light around a glass card. */
export const GLASS_EDGE = 'rgba(255, 255, 255, 0.12)';
