import React from 'react';
import { View } from 'react-native';
import { ThinkingOrb as WebOrb } from 'thinking-orbs';
import type { ThinkingOrbProps } from './types';

/** Browser preview: the original canvas orb, which supports tint natively. */
export function ThinkingOrb({
  state = 'working',
  size = 64,
  theme = 'light',
  speed,
  paused,
  displaySize,
  tint,
  accessibilityLabel,
  style,
}: ThinkingOrbProps) {
  const box = displaySize ?? size;
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[{ width: box, height: box }, style]}
    >
      <WebOrb
        state={state}
        size={size}
        theme={theme === 'auto' ? 'light' : theme}
        speed={speed}
        paused={paused}
        color={tint}
        style={{ width: box, height: box }}
      />
    </View>
  );
}
