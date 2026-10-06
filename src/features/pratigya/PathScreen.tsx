import React from 'react';
import Compass from '../../assets/icons/compass.svg';
import Trophy from '../../assets/icons/trophy.svg';
import { art } from '../../assets/art';
import { OptionCard, OptionList } from '../../components/OptionCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { useProfile } from '../account/store';

export const VOW_STEPS = 6;

export function PathScreen({ navigation }: RootScreenProps<'Path'>) {
  const path = useProfile(s => s.path);
  const setPath = useProfile(s => s.setPath);
  return (
    <SimpleScreen
      testID="path"
      art={art.arrows}
      progress={{ total: VOW_STEPS, filled: 1 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Next"
          disabled={!path}
          onPress={() => navigation.navigate('Pratigya')}
        />
      }
    >
      <QuestionHeader
        eyebrow="Your path"
        title="Will you be tested every day, or sit when you choose?"
        subtitle="You can switch later. Your streak stays either way."
      />
      <QuestionBody>
        <OptionList>
          <OptionCard
            testID="path-challenge"
            icon={Trophy}
            title="Challenge mode"
            tag="Levels"
            description="A focus task every day. Finish it and climb a level. Miss it and fall back to your last one."
            selected={path === 'challenge'}
            onPress={() => setPath('challenge')}
          />
          <OptionCard
            testID="path-self"
            icon={Compass}
            title="Self Focus"
            tag="Free"
            description="No daily test. Start a session whenever you decide to sit."
            selected={path === 'self'}
            onPress={() => setPath('self')}
          />
        </OptionList>
      </QuestionBody>
    </SimpleScreen>
  );
}
