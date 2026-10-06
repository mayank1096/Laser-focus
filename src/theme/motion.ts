import { Easing } from 'react-native-reanimated';

/**
 * Turns a spring described the way Arc UI and SwiftUI describe them — how
 * long it visibly takes and how much it bounces — into the stiffness and
 * damping Reanimated runs on (mass 1).
 */
function spring(visualDuration: number, bounce: number) {
  return {
    stiffness: Math.round((2 * Math.PI) / visualDuration) ** 2,
    damping:
      Math.round(((4 * Math.PI * (1 - bounce)) / visualDuration) * 10) / 10,
    mass: 1,
  };
}

/**
 * Motion tokens, after Arc UI's motion system:
 * - Motion explains cause and effect: what opened, what changed, where it
 *   came from.
 * - Animate transform and opacity; sizes follow on a spring.
 * - Anything repeated many times a minute doesn't animate.
 * - Every animation can be interrupted, and Reanimated's springs and
 *   timings already honour the system "reduce motion" setting.
 */
export const springs = {
  /** Presses, toggles, thumbs and small indicators. */
  snappy: spring(0.26, 0.12),
  /** Panels, height changes and layout shifts. Never overshoots. */
  smooth: spring(0.4, 0),
  /** Shared highlights, shape changes, widths that follow content. */
  morph: spring(0.42, 0.16),
  /** Direct manipulation that must track the finger closely. */
  responsive: { stiffness: 520, damping: 38, mass: 1 },
  /** Larger layout changes that should feel calm. */
  gentle: { stiffness: 340, damping: 34, mass: 1 },
} as const;

/** Shared timing so every screen moves with the same rhythm. */
export const motion = {
  /** Colour and small state changes. */
  fast: 160,
  /** Panels, menus, most transitions. */
  base: 240,
  /** Rare, introductory reveals. */
  slow: 480,
  cinematic: 900,
  /** Delay between staggered elements entering a screen. */
  stagger: 60,
  /** Default for UI transitions. */
  easeStandard: Easing.bezier(0.2, 0, 0, 1),
  /** Elements arriving on screen. */
  easeOut: Easing.bezier(0.16, 1, 0.3, 1),
  /** Shape changes and highlights that follow content. */
  spring: springs.morph,
  /** Presses and toggles. */
  pressSpring: springs.snappy,
  springs,
} as const;
