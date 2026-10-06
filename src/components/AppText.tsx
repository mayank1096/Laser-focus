import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type TypographyVariant } from '../theme';
import { isSerif, sansDigits } from './Numerals';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
}

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
  const resolved = [typography[variant], style];
  return (
    <Text style={resolved} {...rest}>
      {isSerif(resolved) ? sansDigits(children) : children}
    </Text>
  );
}
