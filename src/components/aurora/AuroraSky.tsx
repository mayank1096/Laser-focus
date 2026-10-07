import React from 'react';
import type { ViewStyle } from 'react-native';
import { ShaderView } from '../shader';

/** A warm aurora drifting across `width` × `height`, drawn on the GPU. */
export function AuroraSky(props: {
  width: number;
  height: number;
  style?: ViewStyle;
}) {
  return <ShaderView preset="aurora" {...props} />;
}
