/** Spacing, radii and screen geometry from the Figma frames (402 × 874). */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  /** Horizontal screen gutter. */
  gutter: 26,
  /** Gap between a question header and its answer fields. */
  section: 34,
  /**
   * Pickers sit at a fixed height below the top of the question (Figma: 170pt),
   * so the header reserves this much before the usual section gap.
   */
  pickerHeader: 136,
} as const;

export const radii = {
  field: 10,
  button: 14,
  pill: 999,
} as const;

export const layout = {
  /** Width of the Figma frames — used to scale illustrations. */
  designWidth: 402,
  /** Progress bar sits this far below the safe-area top. */
  progressOffset: 8,
  /** Question content starts this far below the progress bar. */
  contentOffset: 42,
  /** Primary button sits this far above the safe-area bottom. */
  buttonBottom: 46,
  fieldHeight: 48,
  /** Space reserved at the bottom of scrollable content for the button. */
  buttonClearance: 120,
} as const;
