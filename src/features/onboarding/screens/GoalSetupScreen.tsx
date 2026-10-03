import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
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
import ChevronLeft from '../../../assets/icons/chevron-left.svg';
import { IconButton } from '../../../components/IconButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ProgressSegments } from '../../../components/ProgressSegments';
import { SurfaceContext } from '../../../components/Surface';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, layout, motion, spacing } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { StepArt, useArtSize } from '../components/StepArt';
import { nextStepIndex, previousStepIndex, STEPS } from '../steps';
import { useGoalSetup } from '../store';

type Direction = 'forward' | 'back';

/** The art's figures start roughly this far down the illustration. */
const ART_FIGURE_START = 0.42;
/** Height of the fade where scrolled content meets the header. */
const EDGE_FADE = 20;

/** Where to pick up: the saved step, unless it no longer applies. */
function initialIndex(): number {
  const state = useGoalSetup.getState();
  const saved = STEPS.findIndex(s => s.id === state.stepId);
  if (saved === -1) {
    return 0;
  }
  return STEPS[saved].skip?.(state)
    ? Math.max(0, previousStepIndex(saved, state))
    : saved;
}

/**
 * Hosts the goal-setup questions. The progress bar, illustration and button
 * stay put while the question in the middle slides between steps.
 */
export function GoalSetupScreen({ navigation }: RootScreenProps<'GoalSetup'>) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const artSize = useArtSize();
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<Direction>('forward');
  const draft = useGoalSetup();
  const setStep = useGoalSetup(s => s.setStep);
  const step = STEPS[index];
  const canContinue = step.canContinue(draft);
  const surface = step.tone === 'blush' ? colors.blush : colors.white;

  // Remember the position so a closed app resumes here.
  useEffect(() => {
    setStep(step.id);
  }, [step.id, setStep]);

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

  // Fade the art back once the question's content runs into it, and follow
  // new lines down the list.
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const contentTop = useRef(0);
  const lastHeight = useRef(0);
  const [artDimmed, setArtDimmed] = useState(false);
  useEffect(() => {
    lastHeight.current = 0;
  }, [step.id]);

  // Only the current step's list may dim the art: the outgoing step keeps
  // reporting sizes while it animates away.
  const currentStepId = useRef(step.id);
  currentStepId.current = step.id;
  const onContentSize = (forStep: string) => (_: number, height: number) => {
    if (forStep !== currentStepId.current) {
      return;
    }
    const artFigureTop = windowHeight - artSize * (1 - ART_FIGURE_START);
    const contentBottom = contentTop.current + height - spacing.xxl;
    setArtDimmed(contentBottom > artFigureTop);
    if (lastHeight.current > 0 && height > lastHeight.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
    lastHeight.current = height;
  };

  const goTo = useCallback((target: number, dir: Direction) => {
    setDirection(dir);
    setIndex(target);
  }, []);

  const goNext = () => {
    const next = nextStepIndex(index, useGoalSetup.getState());
    if (next === -1) {
      haptics.success();
      useGoalSetup.getState().complete();
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

  const handleBackPress = () => {
    if (!goBack()) {
      navigation.goBack();
    }
  };

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
    <SurfaceContext.Provider value={surface}>
      <Animated.View style={[styles.screen, backgroundStyle]}>
        <StepArt source={step.art} artKey={`${step.art}`} dimmed={artDimmed} />

        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.header,
              { paddingTop: insets.top + layout.progressOffset - 16 },
            ]}
          >
            <IconButton
              Icon={ChevronLeft}
              size={20}
              testID="back-button"
              accessibilityLabel="Back"
              onPress={handleBackPress}
            />
            <View style={styles.progress}>
              <ProgressSegments
                total={STEPS.length}
                filled={index + 1}
                onSegmentPress={i => {
                  // Skipped steps are not revisited; land on the nearest one.
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
          </View>

          <View
            style={[styles.fill, styles.clip]}
            onLayout={e => {
              contentTop.current = e.nativeEvent.layout.y;
            }}
          >
            <Animated.View
              key={step.id}
              entering={entering}
              exiting={exiting}
              style={StyleSheet.absoluteFill}
            >
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onContentSizeChange={onContentSize(step.id)}
              >
                <Component />
              </ScrollView>
            </Animated.View>
            <View
              pointerEvents="none"
              style={[
                styles.edgeFade,
                {
                  backgroundImage: `linear-gradient(180deg, ${surface} 0%, ${surface}00 100%)`,
                },
              ]}
            />
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
    </SurfaceContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // The back button's 36pt hit area hangs into the gutter.
    paddingLeft: spacing.gutter - 12,
    paddingRight: spacing.gutter,
    gap: spacing.xs,
  },
  progress: {
    flex: 1,
  },
  // Scrolled questions slide under the header, never over it.
  clip: {
    overflow: 'hidden',
  },
  edgeFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EDGE_FADE,
  },
  content: {
    paddingTop: layout.contentOffset - 3 - 16,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.lg,
  },
});
