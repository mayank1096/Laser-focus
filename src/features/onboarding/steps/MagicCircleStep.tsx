import React from 'react';
import { OptionCard, OptionList } from '../../../components/OptionCard';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { useGoalSetup } from '../store';

const subtitleFor = (count: number) => {
  if (count <= 1) {
    return 'This one comes first. Everything else waits.';
  }
  if (count === 2) {
    return 'Pick one. The other locks until this is done.';
  }
  return `Pick one. The other ${
    count === 3 ? 'two' : count - 1
  } lock until this is done.`;
};

export function MagicCircleStep() {
  const goals = useGoalSetup(s => s.goals);
  const setPrimaryGoal = useGoalSetup(s => s.setPrimaryGoal);

  return (
    <>
      <QuestionHeader
        eyebrow="The magic circle"
        title={
          goals.length > 1
            ? `If one were granted right now, which makes the other ${
                goals.length === 2 ? 'one' : 'two'
              } easiest?`
            : 'This is your Magic Circle goal.'
        }
        subtitle={subtitleFor(goals.length)}
      />
      <QuestionBody>
        <OptionList>
          {goals.map(goal => (
            <OptionCard
              key={goal.id}
              testID={`goal-option-${goal.id}`}
              title={goal.text}
              selected={goal.isPrimary}
              onPress={() => setPrimaryGoal(goal.id)}
            />
          ))}
        </OptionList>
      </QuestionBody>
    </>
  );
}
