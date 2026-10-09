/**
 * Colour tokens, taken from the Figma file.
 * Use these names in components — never raw hex values.
 */
export const colors = {
  saffron: '#FA8C22',
  saffronGlow: 'rgba(250, 140, 34, 0.75)',
  /** Warm shadow under primary buttons on light screens. */
  /** Kept soft: a warm lift under the button, not an orange halo. */
  buttonShadow: 'rgba(196, 120, 50, 0.16)',
  /** Deep orange: the session hero glow and gentle warnings. */
  ember: '#E25E00',

  ink: '#000000',
  /** Warm black for focus and sessions: the dark the one light sits in. */
  night: '#0E0A08',
  charcoal: '#1A1A1A',
  /** Warm off-white for text and buttons on night screens. */
  cream: '#F4EEE6',
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
  buttonDisabled: '#8A8480',
  textOnDisabled: '#FFFFFF',

  success: '#07DE11',
  danger: '#DE0707',
  /** A calm, readable green for granted and done states. */
  successDeep: '#1E9E4A',
} as const;

export type ColorToken = keyof typeof colors;

/** The silk behind Home and the goal: deep, body, light. Add the page colour it melts into. */
export const SILK = ['#9A3C14', '#D2652A', '#E9A77C'] as const;

/** The full-screen haze behind the ritual, the session and the goal: dark, ember, body, light. */
export const MIST = ['#140806', '#6E2410', '#C2561E', '#EBA06A'] as const;

/** The same haze in red, for the broken vow: dark, blood, body, light. */
export const MIST_RED = ['#120405', '#5A0A10', '#A3141E', '#E2575E'] as const;
