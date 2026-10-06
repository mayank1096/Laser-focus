import React from 'react';
import Crown from '../../assets/icons/crown.svg';
import Target from '../../assets/icons/target.svg';
import Shield from '../../assets/icons/shield.svg';
import { art } from '../../assets/art';
import { OptionCard, OptionList } from '../../components/OptionCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { PRATIGYAS, useProfile, type Pratigya } from '../account/store';
import { VOW_STEPS } from './PathScreen';

const ORDER: Pratigya[] = ['abhimanyu', 'arjun', 'bhishma'];

/** Abhimanyu guards, Arjun aims, Bhishma rules for life. */
const VOW_ICONS = { abhimanyu: Shield, arjun: Target, bhishma: Crown };

export function PratigyaScreen({ navigation }: RootScreenProps<'Pratigya'>) {
  const pratigya = useProfile(s => s.pratigya);
  const setPratigya = useProfile(s => s.setPratigya);
  return (
    <SimpleScreen
      testID="pratigya"
      art={art.kneeling}
      progress={{ total: VOW_STEPS, filled: 2 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Next"
          disabled={!pratigya}
          onPress={() => navigation.navigate('VowAsks')}
        />
      }
    >
      <QuestionHeader
        eyebrow="Your pratigya"
        title="Every warrior took a vow. Which one is yours?"
      />
      <QuestionBody gap={26}>
        <OptionList>
          {ORDER.map(p => (
            <OptionCard
              key={p}
              testID={`pratigya-${p}`}
              icon={VOW_ICONS[p]}
              title={PRATIGYAS[p].name}
              tag={PRATIGYAS[p].tag}
              description={PRATIGYAS[p].short}
              selected={pratigya === p}
              onPress={() => setPratigya(p)}
            />
          ))}
        </OptionList>
      </QuestionBody>
    </SimpleScreen>
  );
}
