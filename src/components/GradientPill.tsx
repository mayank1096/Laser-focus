import React, { useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ShaderView } from './shader';

/** Saffron, coral, marigold and lilac — warm, with one cool note. */
const HUES = ['#FA8C22', '#FF6F61', '#F7C948', '#B79CFF'];

/**
 * A pill whose edge and wash carry four colours flowing sideways through
 * each other on the GPU, bent by noise so the bands never line up.
 */
export function GradientPill({
  children,
  style,
  radius = 10,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  radius?: number;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={[styles.outer, { borderRadius: radius }, style]}
      onLayout={e =>
        setSize({
          width: Math.round(e.nativeEvent.layout.width),
          height: Math.round(e.nativeEvent.layout.height),
        })
      }
    >
      <ShaderView
        preset="hues"
        width={size.width}
        height={size.height}
        colours={HUES}
        style={styles.flow}
      />
      <View style={[styles.inner, { borderRadius: radius - 1.5 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    padding: 1.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  flow: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  inner: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    // Mostly white, so the colours only tint the wash and glow at the edge.
    backgroundColor: 'rgba(255, 255, 255, 0.84)',
  },
});
