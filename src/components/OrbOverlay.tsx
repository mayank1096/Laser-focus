import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, motion, spacing } from '../theme';
import { AppText } from './AppText';
import { ThinkingOrb, type OrbState } from './orb';

/**
 * A quiet waiting state: the screen softens and a saffron thought-orb
 * works in the middle, with one line saying what is happening.
 */
export function OrbOverlay({
  visible,
  label,
  state = 'working',
  tone = 'light',
}: {
  visible: boolean;
  label: string;
  state?: OrbState;
  tone?: 'light' | 'dark';
}) {
  if (!visible) {
    return null;
  }
  const dark = tone === 'dark';
  return (
    <Animated.View
      entering={FadeIn.duration(motion.fast)}
      exiting={FadeOut.duration(motion.fast)}
      style={[styles.fill, dark ? styles.dark : styles.light]}
      accessibilityViewIsModal
      accessibilityLiveRegion="polite"
    >
      <View style={styles.center}>
        <ThinkingOrb
          state={state}
          size={64}
          displaySize={112}
          theme={dark ? 'dark' : 'light'}
          tint={colors.saffron}
          accessibilityLabel={label}
        />
        <AppText
          variant="label"
          style={[styles.label, dark && styles.labelDark]}
        >
          {label}
        </AppText>
      </View>
    </Animated.View>
  );
}

/** A standalone orb screen, e.g. while the app restores its data. */
export function OrbSplash({ label = 'Gathering your sheets…' }) {
  return (
    <View style={[styles.fill, styles.splash]}>
      <OrbOverlay visible label={label} state="breathing" />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  light: {
    backgroundColor: 'rgba(253, 248, 243, 0.94)',
  },
  dark: {
    backgroundColor: 'rgba(14, 10, 8, 0.92)',
  },
  splash: {
    backgroundColor: colors.parchment,
  },
  center: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  label: {
    color: colors.textMuted,
  },
  labelDark: {
    color: 'rgba(244, 238, 230, 0.7)',
  },
});
