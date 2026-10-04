import React, { useState, type ComponentType } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { FlowFrame, type FlowDirection } from '../../../components/FlowFrame';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { reminders } from '../../../services/reminders';
import { today } from '../../../utils/clock';
import { haptics } from '../../../utils/haptics';
import { findClash, usePlanning, type PlanningState } from '../store';
import { RhythmStep } from './RhythmStep';
import { SessionTimesStep } from './SessionTimesStep';
import { ShallowWindowStep } from './ShallowWindowStep';

interface SetupStep {
  id: string;
  Component: ComponentType;
  art?: ImageSourcePropType;
  canContinue: (s: PlanningState) => boolean;
}

const STEPS: SetupStep[] = [
  {
    id: 'times',
    Component: SessionTimesStep,
    canContinue: s => s.slots.length > 0 && !findClash(s.slots),
  },
  {
    id: 'shallow',
    Component: ShallowWindowStep,
    art: require('../../../assets/images/warrior-arrows.jpg'),
    canContinue: () => true,
  },
  { id: 'rhythm', Component: RhythmStep, canContinue: () => true },
];

/** Three questions that turn goals into a daily shape. */
export function WeekSetupScreen({ navigation }: RootScreenProps<'WeekSetup'>) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<FlowDirection>('forward');
  const state = usePlanning();
  const step = STEPS[index];
  const last = index === STEPS.length - 1;

  const goTo = (target: number, dir: FlowDirection) => {
    setDirection(dir);
    setIndex(target);
  };

  const finish = () => {
    const planning = usePlanning.getState();
    planning.completeSetup(today());
    reminders.schedule(planning.rhythm);
    haptics.success();
    navigation.reset({ index: 0, routes: [{ name: 'DayOne' }] });
  };

  const { Component } = step;
  return (
    <FlowFrame
      testID="week-setup"
      stepKey={step.id}
      direction={direction}
      art={step.art}
      onBack={() =>
        index === 0 ? navigation.goBack() : goTo(index - 1, 'back')
      }
      progress={{
        total: STEPS.length,
        filled: index + 1,
        onSegmentPress: i => goTo(i, 'back'),
      }}
      footer={
        <PrimaryButton
          testID="next-button"
          label={last ? 'Done' : 'Next'}
          disabled={!step.canContinue(state)}
          onPress={() => (last ? finish() : goTo(index + 1, 'forward'))}
        />
      }
    >
      <Component />
    </FlowFrame>
  );
}
