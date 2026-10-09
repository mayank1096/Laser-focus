import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type TypographyVariant } from '../theme';
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
  const resolved = [
    typography[variant],
    style,
    hasDevanagari(children) ? noTracking : null,
  ];
  return (
    <Text style={resolved} {...rest}>
      {isSerif(resolved) ? sansDigits(children) : children}
    </Text>
  );
}
