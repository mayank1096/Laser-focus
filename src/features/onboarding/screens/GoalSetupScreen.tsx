import React, { useEffect, useState } from 'react';
import { FlowFrame, type FlowDirection } from '../../../components/FlowFrame';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { haptics } from '../../../utils/haptics';
import { nextStepIndex, previousStepIndex, STEPS } from '../steps';
import { useGoalSetup } from '../store';

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
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<FlowDirection>('forward');
  const draft = useGoalSetup();
  const setStep = useGoalSetup(s => s.setStep);
  const step = STEPS[index];

  // Remember the position so a closed app resumes here.
  useEffect(() => {
    setStep(step.id);
  }, [step.id, setStep]);

  const goTo = (target: number, dir: FlowDirection) => {
    setDirection(dir);
    setIndex(target);
  };

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

  const goBack = () => {
    const prev = previousStepIndex(index, useGoalSetup.getState());
    if (prev === -1) {
      navigation.goBack();
    } else {
      goTo(prev, 'back');
    }
  };

  const { Component } = step;

  return (
    <FlowFrame
      stepKey={step.id}
      direction={direction}
      art={step.art}
      tone={step.tone}
      onBack={goBack}
      progress={{
        total: STEPS.length,
        filled: index + 1,
        onSegmentPress: i => {
          // Skipped steps are not revisited; land on the nearest one.
          const state = useGoalSetup.getState();
          const target = STEPS[i].skip?.(state)
            ? previousStepIndex(i, state)
            : i;
          if (target >= 0) {
            haptics.selection();
            goTo(target, 'back');
          }
        },
      }}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Next"
          onPress={goNext}
          disabled={!step.canContinue(draft)}
          shadow={step.tone === 'blush' ? 'none' : 'ember'}
        />
      }
    >
      <Component />
    </FlowFrame>
  );
}
