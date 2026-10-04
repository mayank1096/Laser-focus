import type { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Font family names match each font file's PostScript name, which is what
 * both iOS and Android resolve after `npx react-native-asset`.
 */
export const fonts = {
  serif: 'YoungSerif-Regular',
  sans: 'Satoshi-Regular',
  sansMedium: 'Satoshi-Medium',
  sansBold: 'Satoshi-Bold',
  sansItalic: 'Satoshi-Italic',
} as const;

/** Figma letter-spacing is -2% on most styles. */
const tight = (size: number) => size * -0.02;

const style = (s: TextStyle) => s;

export const typography = {
  display: style({
    fontFamily: fonts.serif,
    fontSize: 45,
    lineHeight: 45 * 1.1,
    letterSpacing: tight(45),
    color: colors.ink,
  }),
  title: style({
    fontFamily: fonts.serif,
    fontSize: 29,
    lineHeight: 29 * 1.1,
    letterSpacing: tight(29),
    color: colors.ink,
  }),
  sanskrit: style({
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 20 * 1.3,
    letterSpacing: tight(20),
    color: colors.saffron,
  }),
  heading: style({
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 20 * 1.2,
    letterSpacing: tight(20),
    color: colors.ink,
  }),
  button: style({
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 16 * 1.1,
    letterSpacing: tight(16),
    color: colors.white,
  }),
  cardTitle: style({
    fontFamily: fonts.serif,
    fontSize: 14,
    lineHeight: 14 * 1.3,
    letterSpacing: tight(14),
    color: colors.ink,
  }),
  eyebrow: style({
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    lineHeight: 10 * 1.3,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  }),
  body: style({
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 14 * 1.3,
    letterSpacing: tight(14),
    color: colors.ink,
  }),
  bodyMedium: style({
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 14 * 1.3,
    letterSpacing: tight(14),
    color: colors.ink,
  }),
  bodyBold: style({
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 14 * 1.3,
    letterSpacing: tight(14),
    color: colors.ink,
  }),
  label: style({
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 12 * 1.3,
    letterSpacing: tight(12),
    color: colors.ink,
  }),
  caption: style({
    fontFamily: fonts.sansItalic,
    fontSize: 12,
    lineHeight: 12 * 1.3,
    letterSpacing: tight(12),
    color: colors.textFaint,
  }),
  micro: style({
    fontFamily: fonts.sans,
    fontSize: 10,
    lineHeight: 10 * 1.3,
    letterSpacing: tight(10),
    color: colors.ink,
  }),
  pickerValue: style({
    fontFamily: fonts.sans,
    fontSize: 18,
    lineHeight: 18 * 1.3,
    letterSpacing: tight(18),
    color: colors.saffron,
  }),
} as const;

export type TypographyVariant = keyof typeof typography;
