import React from 'react';
import { art } from '../../assets/art';
import { OptionCard, OptionList } from '../../components/OptionCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { PRATIGYAS, useProfile, type Pratigya } from '../../features/account/store';

export const VOW_STEPS = 5;
import { useT } from '../../i18n';

const ORDER: Pratigya[] = ['abhimanyu', 'arjun', 'bhishma'];

export function PratigyaScreen({ navigation }: RootScreenProps<'Pratigya'>) {
  const t = useT();
  const pratigya = useProfile(s => s.pratigya);
  const setPratigya = useProfile(s => s.setPratigya);
  return (
    <SimpleScreen
      testID="pratigya"
      art={art.kneeling}
      progress={{ total: VOW_STEPS, filled: 1 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label={t.common.next}
          disabled={!pratigya}
          onPress={() => navigation.navigate('VowAsks')}
        />
      }
    >
      <QuestionHeader
        eyebrow={t.vow.pratigyaEyebrow}
        title={t.vow.pratigyaTitle}
      />
      <QuestionBody gap={26}>
        <OptionList>
          {ORDER.map(p => (
            <OptionCard
              key={p}
              testID={`pratigya-${p}`}
              title={PRATIGYAS[p].latin}
              note={PRATIGYAS[p].name}
              tag={t.vow.names[p].tag}
              description={t.vow.names[p].short}
              selected={pratigya === p}
              onPress={() => setPratigya(p)}
            />
          ))}
        </OptionList>
      </QuestionBody>
    </SimpleScreen>
  );
}
