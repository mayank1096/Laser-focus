import React, { useCallback, useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ProgressSegments } from '../../../components/ProgressSegments';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, layout, motion, spacing } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { StepArt } from '../components/StepArt';
import { nextStepIndex, previousStepIndex, STEPS } from '../steps';
import { useGoalSetup } from '../store';

type Direction = 'forward' | 'back';

/**
 * Hosts the nine goal-setup questions. The progress bar, illustration and
 * button stay put while the question in the middle slides between steps.
 */
export function GoalSetupScreen({ navigation }: RootScreenProps<'GoalSetup'>) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>('forward');
  const draft = useGoalSetup();
  const step = STEPS[index];
  const canContinue = step.canContinue(draft);

  const tone = useSharedValue(step.tone === 'blush' ? 1 : 0);
  useEffect(() => {
    tone.value = withTiming(step.tone === 'blush' ? 1 : 0, {
      duration: motion.slow,
    });
  }, [step.tone, tone]);

  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      tone.value,
      [0, 1],
      [colors.white, colors.blush],
    ),
  }));

  const goTo = useCallback((target: number, dir: Direction) => {
    setDirection(dir);
    setIndex(target);
  }, []);

  const goNext = () => {
    const next = nextStepIndex(index, useGoalSetup.getState());
    if (next === -1) {
      haptics.success();
      navigation.navigate('SetupComplete');
      return;
    }
    goTo(next, 'forward');
  };

  const goBack = useCallback(() => {
    const prev = previousStepIndex(index, useGoalSetup.getState());
    if (prev === -1) {
      return false;
    }
    goTo(prev, 'back');
    return true;
  }, [index, goTo]);

  // Android back button walks back through the questions first.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  const { Component } = step;
  const entering = (direction === 'forward' ? FadeInRight : FadeInLeft)
    .duration(motion.base)
    .easing(motion.easeOut);
  const exiting = (
    direction === 'forward' ? FadeOutLeft : FadeOutRight
  ).duration(motion.fast);

  return (
    <Animated.View style={[styles.screen, backgroundStyle]}>
      <StepArt source={step.art} artKey={`${step.art}`} />

      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.progress,
            { paddingTop: insets.top + layout.progressOffset },
          ]}
        >
          <ProgressSegments
            total={STEPS.length}
            filled={index + 1}
            onSegmentPress={i => {
              // Skipped steps are not revisited; land on the nearest real one.
              const state = useGoalSetup.getState();
              const target = STEPS[i].skip?.(state)
                ? previousStepIndex(i, state)
                : i;
              if (target >= 0) {
                haptics.selection();
                goTo(target, 'back');
              }
            }}
          />
        </View>

        <View style={styles.fill}>
          <Animated.View
            key={step.id}
            entering={entering}
            exiting={exiting}
            style={StyleSheet.absoluteFill}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Component />
            </ScrollView>
          </Animated.View>
        </View>

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + layout.buttonBottom },
          ]}
        >
          <PrimaryButton
            testID="next-button"
            label="Next"
            onPress={goNext}
            disabled={!canContinue}
            shadow={step.tone === 'blush' ? 'none' : 'ember'}
          />
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  progress: {
    paddingHorizontal: spacing.gutter,
  },
  content: {
    paddingTop: layout.contentOffset - 3,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.lg,
  },
});
