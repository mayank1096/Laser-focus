import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, layout, spacing, typography } from '../../../theme';
import { rise } from '../components/QuestionHeader';
import { useGoalSetup } from '../store';

/**
 * Placeholder end of the goal-setup flow.
 * TODO: replace with "Path & Pratigya onboarding" (Figma B2-01 onwards).
 */
export function SetupCompleteScreen({
  navigation,
}: RootScreenProps<'SetupComplete'>) {
  const insets = useSafeAreaInsets();
  const primary = useGoalSetup(s => s.goals.find(g => g.isPrimary));

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + layout.contentOffset }]}
    >
      <View style={styles.copy}>
        <Animated.Text entering={rise(0)} style={typography.eyebrow}>
          Your sheets are written
        </Animated.Text>
        <Animated.Text entering={rise(1)} style={typography.title}>
          {primary?.text ?? 'Your goal'}
        </Animated.Text>
        <Animated.Text entering={rise(2)} style={typography.body}>
          Next: choose your path and take your pratigya.
        </Animated.Text>
      </View>
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + layout.buttonBottom },
        ]}
      >
        <PrimaryButton
          label="Review my sheets"
          onPress={() => navigation.goBack()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.gutter,
  },
  copy: {
    gap: spacing.lg,
  },
  footer: {
    marginTop: 'auto',
  },
});
