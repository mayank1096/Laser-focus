import React from 'react';
import { ListField } from '../../../components/ListField';
import { QuestionBody, QuestionHeader } from '../components/QuestionHeader';
import { LIMITS, useGoalSetup } from '../store';

export function ValuesStep() {
  const values = useGoalSetup(s => s.values);
  const setValues = useGoalSetup(s => s.setValues);

  return (
    <>
      <QuestionHeader
        eyebrow="Values · Once in a lifetime"
        title="What do you want said about you when you die?"
        subtitle="Write in past tense, as if it already happened. Three lines."
      />
      <QuestionBody>
        <ListField
          testID="values-list"
          items={values}
          onChange={setValues}
          max={LIMITS.values.max}
          min={LIMITS.values.min}
          addLabel="Add a new Value"
          placeholder="I never wasted a single day"
          idPrefix="value"
        />
      </QuestionBody>
    </>
  );
}
