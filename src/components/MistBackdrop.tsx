import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { MIST } from '../theme';
import { ShaderView } from './shader';

/** The slow full-screen haze, laid behind a screen's content. */
export function MistBackdrop() {
  const { width, height } = useWindowDimensions();
  return (
    <ShaderView
      preset="mist"
      width={width}
      height={height}
      colours={MIST}
      style={StyleSheet.absoluteFill}
    />
  );
}
