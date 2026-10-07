import React from 'react';
import type { ViewStyle } from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
  useClock,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { AURORA_SKSL } from './shader';

const effect = Skia.RuntimeEffect.Make(AURORA_SKSL);

/** A warm aurora drifting across `width` × `height`, drawn on the GPU. */
export function AuroraSky({
  width,
  height,
  style,
}: {
  width: number;
  height: number;
  style?: ViewStyle;
}) {
  const clock = useClock();
  const uniforms = useDerivedValue(() => ({
    res: [width, height],
    time: clock.value / 1000,
  }));
  if (!effect) {
    return null;
  }
  return (
    <Canvas style={[{ width, height }, style]} pointerEvents="none">
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
