import React from 'react';
import { art } from '../../../assets/art';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { SimpleScreen } from '../../../components/SimpleScreen';
import { TextField } from '../../../components/TextField';
import type { RootScreenProps } from '../../../navigation/types';
import { useProfile } from '../store';

export function NameScreen({ navigation }: RootScreenProps<'Name'>) {
  const name = useProfile(s => s.name);
  const setName = useProfile(s => s.setName);
  const ready = name.trim().length >= 2;

  return (
    <SimpleScreen
      testID="name"
      art={art.standing}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Continue"
          disabled={!ready}
          onPress={() => navigation.navigate('GoalSetup')}
        />
      }
    >
      <QuestionHeader
        eyebrow="Your name"
        title="What should we call you?"
        subtitle="Your first name. It goes on your vow."
      />
      <QuestionBody gap={28}>
        <TextField
          testID="name-input"
          accessibilityLabel="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Aarav"
          autoFocus
          maxLength={40}
        />
      </QuestionBody>
    </SimpleScreen>
  );
}
