/**
 * Colour tokens, taken from the Figma file.
 * Use these names in components — never raw hex values.
 */
export const colors = {
  saffron: '#FA8C22',
  saffronGlow: 'rgba(250, 140, 34, 0.75)',
  /** Warm shadow under primary buttons on light screens. */
  buttonShadow: '#E2AE7A',
  /** Deep orange: the session hero glow and gentle warnings. */
  ember: '#E25E00',

  ink: '#000000',
  charcoal: '#1A1A1A',
  white: '#FFFFFF',

  /** Background of the Anti-goal sheet. */
  blush: '#FFE8E8',
  /** Transparent start of the welcome hero fade. */
  sandClear: 'rgba(247, 244, 242, 0)',

  textMuted: 'rgba(0, 0, 0, 0.5)',
  textFaint: 'rgba(0, 0, 0, 0.4)',
  textGhost: 'rgba(0, 0, 0, 0.2)',

  border: 'rgba(0, 0, 0, 0.2)',
  hairline: 'rgba(0, 0, 0, 0.1)',
  track: 'rgba(0, 0, 0, 0.1)',
  tick: 'rgba(0, 0, 0, 0.3)',
  chip: 'rgba(0, 0, 0, 0.04)',

  /** Solid so a locked button still reads on top of the illustrations. */
  buttonDisabled: '#D9D5D2',
  textOnDisabled: '#FFFFFF',

  success: '#07DE11',
  danger: '#DE0707',
} as const;

export type ColorToken = keyof typeof colors;
