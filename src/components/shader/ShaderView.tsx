import React, { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import {
  Canvas,
  Fill,
  Shader,
  Skia,
  useClock,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { colourUniforms, skslFor, type ShaderPreset } from './presets';

const cache = new Map<
  ShaderPreset,
  ReturnType<typeof Skia.RuntimeEffect.Make>
>();
const effectFor = (preset: ShaderPreset) => {
  if (!cache.has(preset)) {
    cache.set(preset, Skia.RuntimeEffect.Make(skslFor(preset)));
  }
  return cache.get(preset) ?? null;
};

export interface ShaderViewProps {
  preset: ShaderPreset;
  width: number;
  height: number;
  /** Up to four '#RRGGBB' colours, as the preset expects. */
  colours?: readonly string[];
  style?: ViewStyle;
}

/** A living GPU surface: one shader preset drawn on its own clock. */
export function ShaderView({
  preset,
  width,
  height,
  colours,
  style,
}: ShaderViewProps) {
  const clock = useClock();
  const [c0, c1, c2, c3] = useMemo(
    () => colourUniforms(colours),
    // Colours are passed as literals; compare by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colours?.join()],
  );
  const uniforms = useDerivedValue(() => ({
    res: [width, height],
    time: clock.value / 1000,
    c0,
    c1,
    c2,
    c3,
  }));
  const effect = effectFor(preset);
  if (!effect || !width || !height) {
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
