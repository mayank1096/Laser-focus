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
  /** Warm black for focus and sessions: the dark the one light sits in. */
  night: '#0E0A08',
  charcoal: '#1A1A1A',
  white: '#FFFFFF',

  /** Background of the Anti-goal sheet. */
  blush: '#FFE8E8',
  /** Lines and tags on a blush screen. */
  blushDeep: '#FFDBDB',
  /** Warm off-white behind sheets and the Tasks tab. */
  parchment: '#FFF7F1',
  /** Quiet grey fill for tags and secondary cards. */
  stone: '#F7F5F4',
  /** Selected chips and nudges: saffron at a whisper. */
  saffronWash: '#FFF6ED',
  saffronLine: 'rgba(250, 140, 34, 0.2)',
  /** Transparent start of the welcome hero fade. */
  sandClear: 'rgba(247, 244, 242, 0)',

  textMuted: 'rgba(0, 0, 0, 0.5)',
  textFaint: 'rgba(0, 0, 0, 0.4)',
  textGhost: 'rgba(0, 0, 0, 0.2)',

  border: 'rgba(0, 0, 0, 0.2)',
  hairline: 'rgba(0, 0, 0, 0.1)',
  divider: 'rgba(0, 0, 0, 0.06)',
  track: 'rgba(0, 0, 0, 0.1)',
  tick: 'rgba(0, 0, 0, 0.3)',
  chip: 'rgba(0, 0, 0, 0.04)',
  scrim: 'rgba(18, 13, 10, 0.4)',

  /** Solid so a locked button still reads on top of the illustrations. */
  buttonDisabled: '#D9D5D2',
  textOnDisabled: '#FFFFFF',

  success: '#07DE11',
  danger: '#DE0707',
} as const;

export type ColorToken = keyof typeof colors;
