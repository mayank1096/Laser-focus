import React from 'react';
import { art } from '../../../assets/art';
import { OptionCard, OptionList } from '../../../components/OptionCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { SimpleScreen } from '../../../components/SimpleScreen';
import type { RootScreenProps } from '../../../navigation/types';
import { useProfile } from '../store';

export function LanguageScreen({ navigation }: RootScreenProps<'Language'>) {
  const language = useProfile(s => s.language);
  const setLanguage = useProfile(s => s.setLanguage);
  return (
    <SimpleScreen
      testID="language"
      art={art.bowShoulders}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Continue"
          onPress={() => navigation.navigate('Name')}
        />
      }
    >
      <QuestionHeader
        eyebrow="Language"
        title="Which language do you think in?"
        subtitle="You can change this later in Account."
      />
      <QuestionBody>
        <OptionList>
          <OptionCard
            testID="language-en"
            title="English"
            description="The whole app, in English."
            selected={language === 'en'}
            onPress={() => setLanguage('en')}
          />
          <OptionCard
            testID="language-hi"
            title="हिंदी"
            description="जल्द आ रहा है · Coming soon"
            tag="Soon"
            disabled
            selected={false}
            onPress={() => {}}
          />
        </OptionList>
      </QuestionBody>
    </SimpleScreen>
  );
}
