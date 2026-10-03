import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { motion, spacing, typography } from '../../../theme';

/** Each line of a question rises in slightly after the one above it. */
export const rise = (order: number) =>
  FadeInDown.delay(order * motion.stagger)
    .duration(motion.slow)
    .easing(motion.easeOut);

export interface QuestionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /**
   * Reserve at least this much height, so whatever follows starts at a fixed
   * position however many lines the title wraps to.
   */
  minHeight?: number;
}

export function QuestionHeader({
  eyebrow,
  title,
  subtitle,
  minHeight,
}: QuestionHeaderProps) {
  return (
    <View style={[styles.header, { minHeight }]}>
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {eyebrow}
      </Animated.Text>
      <View style={styles.copy}>
        <Animated.Text
          entering={rise(1)}
          style={typography.title}
          accessibilityRole="header"
        >
          {title}
        </Animated.Text>
        {subtitle ? (
          <Animated.Text entering={rise(2)} style={typography.body}>
            {subtitle}
          </Animated.Text>
        ) : null}
      </View>
    </View>
  );
}

/** Wraps the answer area so it enters after the header. */
export function QuestionBody({
  children,
  gap = spacing.section,
}: {
  children: React.ReactNode;
  gap?: number;
}) {
  return (
    <Animated.View entering={rise(3)} style={{ marginTop: gap }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xl,
  },
  copy: {
    gap: spacing.lg,
  },
});
