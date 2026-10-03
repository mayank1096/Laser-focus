import React from 'react';
import { ListField } from '../../../components/ListField';
import type { SheetLine } from '../../../types/models';
import { QuestionBody, QuestionHeader } from '../components/QuestionHeader';
import { LIMITS, useGoalSetup } from '../store';

export function GoalsStep() {
  const goals = useGoalSetup(s => s.goals);
  const setGoals = useGoalSetup(s => s.setGoals);

  const handleChange = (lines: SheetLine[]) =>
    setGoals(
      lines.map(line => ({
        ...line,
        isPrimary: goals.find(g => g.id === line.id)?.isPrimary ?? false,
      })),
    );

  return (
    <>
      <QuestionHeader
        eyebrow="The magic circle"
        title="Write your long-term goals that would make those lines true."
        subtitle={`Max ${LIMITS.goals.max} goals can be added`}
      />
      <QuestionBody>
        <ListField
          testID="goals-list"
          items={goals}
          onChange={handleChange}
          max={LIMITS.goals.max}
          min={LIMITS.goals.min}
          addLabel="Add a new Goal"
          placeholder="Clear CA Foundation"
          idPrefix="goal"
        />
      </QuestionBody>
    </>
  );
}
