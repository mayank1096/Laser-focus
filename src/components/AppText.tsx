import React from 'react';
import { Text, type TextProps } from 'react-native';
import { typography, type TypographyVariant } from '../theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
}

/** Text that always uses a typography token from the design system. */
export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  return <Text style={[typography[variant], style]} {...rest} />;
}
