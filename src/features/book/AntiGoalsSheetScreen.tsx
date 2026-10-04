import React from 'react';
import { ListField } from '../../components/ListField';
import type { RootScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { LIMITS, useGoalSetup } from '../onboarding/store';
import { SheetPage } from './components/SheetPage';

export function AntiGoalsSheetScreen({
  navigation,
}: RootScreenProps<'AntiGoalsSheet'>) {
  const antiGoals = useGoalSetup(s => s.antiGoals);
  const setAntiGoals = useGoalSetup(s => s.setAntiGoals);
  return (
    <SheetPage
      testID="antigoals-sheet"
      eyebrow="Once every few years"
      title="Anti-goals"
      subtitle="Write the regrets. Be cruel."
      panel={colors.blush}
      onBack={() => navigation.goBack()}
    >
      <ListField
        testID="antigoals-sheet-list"
        appearance="card"
        cardColor={colors.blushDeep}
        items={antiGoals}
        onChange={setAntiGoals}
        max={LIMITS.antiGoals.max}
        addLabel="Add a regret"
        placeholder="Five minutes of scrolling became five years"
        idPrefix="antigoal"
      />
    </SheetPage>
  );
}
