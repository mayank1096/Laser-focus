import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import {
  fonts,
  SMALL_TEXT,
  typography,
  type TypographyVariant,
} from '../theme';
import { isSerif, sansDigits } from './Numerals';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
}

const DEVANAGARI = /[\u0900-\u097F]/;
const hasDevanagari = (node: React.ReactNode): boolean =>
  typeof node === 'string'
    ? DEVANAGARI.test(node)
    : Array.isArray(node) && node.some(hasDevanagari);
/** Tracking pulls Devanagari's joined letters apart. */
const noTracking = { letterSpacing: 0 };
/** Small text is never medium or bold, whatever a screen asks for. */
const regular = { fontFamily: fonts.sans };
const tooHeavy = (style: TextProps['style']) => {
  const flat = StyleSheet.flatten(style);
  return (
    (flat?.fontSize ?? 15) <= SMALL_TEXT &&
    (flat?.fontFamily === fonts.sansMedium ||
      flat?.fontFamily === fonts.sansBold)
  );
};

/**
 * Text that always uses a typography token from the design system. Numbers
 * inside serif text are set in Google Sans.
 */
export function AppText({
  variant = 'body',
  style,
  children,
  ...rest
}: AppTextProps) {
  const base = [typography[variant], style];
  const resolved = [
    ...base,
    tooHeavy(base) ? regular : null,
    hasDevanagari(children) ? noTracking : null,
  ];
  return (
    <Text style={resolved} {...rest}>
      {isSerif(resolved) ? sansDigits(children) : children}
    </Text>
  );
}
