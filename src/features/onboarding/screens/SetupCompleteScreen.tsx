import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, layout, spacing, typography } from '../../../theme';
import { rise } from '../../../components/QuestionHeader';
import { useGoalSetup } from '../store';

/**
 * End of the goal-setup flow; leads into planning the first week.
 * TODO(devs): "Path & Pratigya" onboarding (Figma 3.01–3.07) slots in
 * between this screen and week setup.
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
          Next: give your days a shape. Three questions.
        </Animated.Text>
      </View>
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + layout.buttonBottom },
        ]}
      >
        <PrimaryButton
          testID="setup-week"
          label="Set up my week"
          onPress={() => navigation.navigate('WeekSetup')}
        />
        <Pressable
          testID="review-sheets"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.review}
          onPress={() => {
            // Back into the questions; finishing them again completes setup.
            useGoalSetup.setState({ completed: false });
            navigation.navigate('GoalSetup');
          }}
        >
          <Text style={[typography.label, styles.reviewText]}>
            Review my sheets
          </Text>
        </Pressable>
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
    gap: spacing.xl,
  },
  review: {
    alignSelf: 'center',
  },
  reviewText: {
    color: colors.textMuted,
  },
});
