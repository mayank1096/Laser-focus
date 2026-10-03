import type { ComponentType } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { useGoalSetup } from '../store';
import { ActionStep } from './ActionStep';
import { AntiGoalStep } from './AntiGoalStep';
import { CountStep } from './CountStep';
import { DeadlineStep } from './DeadlineStep';
import { GoalsStep } from './GoalsStep';
import { MagicCircleStep } from './MagicCircleStep';
import { MilestonesStep } from './MilestonesStep';
import { ValuesStep } from './ValuesStep';
import { WorkShapeStep } from './WorkShapeStep';

type Draft = ReturnType<typeof useGoalSetup.getState>;

export interface StepDefinition {
  id: string;
  Component: ComponentType;
  art: ImageSourcePropType;
  /** Whether the Next button is enabled. */
  canContinue: (draft: Draft) => boolean;
  /** Steps that do not apply to this plan are skipped. */
  skip?: (draft: Draft) => boolean;
  tone?: 'light' | 'blush';
}

const art = {
  standing: require('../../../assets/images/warrior-standing.jpg'),
  arrows: require('../../../assets/images/warrior-arrows.jpg'),
  drawingBow: require('../../../assets/images/warrior-drawing-bow.jpg'),
  kneeling: require('../../../assets/images/warrior-kneeling.jpg'),
  bowShoulders: require('../../../assets/images/warrior-bow-shoulders.jpg'),
  antiGoal: require('../../../assets/images/warrior-antigoal.jpg'),
};

/** The goal-setup flow, in order. The progress bar has one segment per step. */
export const STEPS: StepDefinition[] = [
  {
    id: 'values',
    Component: ValuesStep,
    art: art.standing,
    canContinue: d => d.values.length > 0,
  },
  {
    id: 'goals',
    Component: GoalsStep,
    art: art.arrows,
    canContinue: d => d.goals.length > 0,
  },
  {
    id: 'magicCircle',
    Component: MagicCircleStep,
    art: art.drawingBow,
    canContinue: d => d.goals.some(g => g.isPrimary),
  },
  {
    id: 'action',
    Component: ActionStep,
    art: art.kneeling,
    canContinue: d => d.action.trim().length >= 3,
  },
  {
    id: 'workShape',
    Component: WorkShapeStep,
    art: art.bowShoulders,
    canContinue: d => d.workShape !== null,
  },
  {
    id: 'count',
    Component: CountStep,
    art: art.arrows,
    canContinue: () => true,
    // Counting only makes sense for the same work repeated.
    skip: d => d.workShape === 'stages',
  },
  {
    id: 'deadline',
    Component: DeadlineStep,
    art: art.standing,
    canContinue: () => true,
  },
  {
    id: 'milestones',
    Component: MilestonesStep,
    art: art.arrows,
    canContinue: d => d.milestones.length > 0,
  },
  {
    id: 'antiGoal',
    Component: AntiGoalStep,
    art: art.antiGoal,
    canContinue: d => d.antiGoals.length > 0,
    tone: 'blush',
  },
];

/** Index of the next step that applies, or -1 at the end. */
export function nextStepIndex(from: number, draft: Draft): number {
  for (let i = from + 1; i < STEPS.length; i++) {
    if (!STEPS[i].skip?.(draft)) {
      return i;
    }
  }
  return -1;
}

/** Index of the previous step that applies, or -1 at the start. */
export function previousStepIndex(from: number, draft: Draft): number {
  for (let i = from - 1; i >= 0; i--) {
    if (!STEPS[i].skip?.(draft)) {
      return i;
    }
  }
  return -1;
}
