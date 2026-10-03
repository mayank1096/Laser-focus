import React from 'react';
import { ListField } from '../../../components/ListField';
import { QuestionBody, QuestionHeader } from '../components/QuestionHeader';
import { LIMITS, useGoalSetup } from '../store';

export function AntiGoalStep() {
  const antiGoals = useGoalSetup(s => s.antiGoals);
  const setAntiGoals = useGoalSetup(s => s.setAntiGoals);

  return (
    <>
      <QuestionHeader
        eyebrow="Anti-goal"
        title="Write the regrets. Be cruel. This is the sheet you read when you do not feel like working."
      />
      <QuestionBody>
        <ListField
          testID="antigoals-list"
          items={antiGoals}
          onChange={setAntiGoals}
          max={LIMITS.antiGoals.max}
          addLabel="Add a new Antigoal"
          placeholder="Batch ke saare log aage nikal gaye"
          idPrefix="antigoal"
        />
      </QuestionBody>
    </>
  );
}
