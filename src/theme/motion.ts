import { Easing } from 'react-native-reanimated';

/** Shared timing so every screen moves with the same rhythm. */
export const motion = {
  fast: 180,
  base: 320,
  slow: 520,
  cinematic: 900,
  /** Delay between staggered elements entering a screen. */
  stagger: 70,
  easeOut: Easing.bezier(0.22, 1, 0.36, 1),
  spring: { damping: 18, stiffness: 220, mass: 0.8 },
  pressSpring: { damping: 15, stiffness: 400 },
} as const;
