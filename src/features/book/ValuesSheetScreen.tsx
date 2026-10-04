import React from 'react';
import { ListField } from '../../components/ListField';
import type { RootScreenProps } from '../../navigation/types';
import { LIMITS, useGoalSetup } from '../onboarding/store';
import { SheetPage } from './components/SheetPage';

export function ValuesSheetScreen({
  navigation,
}: RootScreenProps<'ValuesSheet'>) {
  const values = useGoalSetup(s => s.values);
  const setValues = useGoalSetup(s => s.setValues);
  return (
    <SheetPage
      testID="values-sheet"
      eyebrow="Once in a lifetime"
      title="Values"
      subtitle="Written in past tense. Read slowly."
      onBack={() => navigation.goBack()}
    >
      <ListField
        testID="values-sheet-list"
        appearance="card"
        items={values}
        onChange={setValues}
        max={LIMITS.values.max}
        addLabel="Add a value"
        placeholder="I never wasted a single day"
        idPrefix="value"
      />
    </SheetPage>
  );
}
