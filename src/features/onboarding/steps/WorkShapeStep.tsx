import ListChecks from '../../../assets/icons/list-checks.svg';
import Flag from '../../../assets/icons/flag.svg';
import React from 'react';
import { OptionCard, OptionList } from '../../../components/OptionCard';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { useGoalSetup } from '../store';

export function WorkShapeStep() {
  const workShape = useGoalSetup(s => s.workShape);
  const setWorkShape = useGoalSetup(s => s.setWorkShape);

  return (
    <>
      <QuestionHeader
        eyebrow="The shape of the work"
        title="Is this the same work repeated, or different work in stages?"
        subtitle="This decides how your milestones are built. Read both before choosing."
      />
      <QuestionBody>
        <OptionList>
          <OptionCard
            testID="shape-repeated"
            icon={ListChecks}
            title="Same thing, many times"
            description="Mock tests. Videos published. Gym sessions. Practice hours. Cold emails sent."
            selected={workShape === 'repeated'}
            onPress={() => setWorkShape('repeated')}
          />
          <OptionCard
            testID="shape-stages"
            icon={Flag}
            title="Different work in stages"
            description="Launch a brand. Get a job. Finish a syllabus. Ship a product."
            selected={workShape === 'stages'}
            onPress={() => setWorkShape('stages')}
          />
        </OptionList>
      </QuestionBody>
    </>
  );
}
