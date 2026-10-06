import Flame from '../../../assets/icons/flame.svg';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { OptionCard, OptionList } from '../../../components/OptionCard';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { TextField } from '../../../components/TextField';
import { colors, motion, spacing } from '../../../theme';
import { SessionTag } from '../components/SessionTag';
import { useSheetDraft, type ChallengeKind } from './draft';

const KINDS: {
  id: ChallengeKind;
  title: string;
  description: string;
  placeholder: string;
}[] = [
  {
    id: 'faster',
    title: 'Faster',
    description: 'Same work, less time',
    placeholder: 'Finish in 3 hours, not 3 h 10 min',
  },
  {
    id: 'better',
    title: 'Better',
    description: 'Higher score, fewer mistakes',
    placeholder: 'Score 65 or more',
  },
  {
    id: 'harder',
    title: 'Harder',
    description: 'Tougher material, less help',
    placeholder: 'No calculator for Part A',
  },
];

export function ChallengeStep() {
  const { draft, update, last, tag } = useSheetDraft();
  const kind = KINDS.find(k => k.id === draft.challengeKind);

  return (
    <>
      <SessionTag text={tag} />
      <QuestionHeader
        eyebrow="Challenge"
        title="Make it one step harder."
        subtitle={
          last ? undefined : 'First sheet: set the bar you’ll beat next time.'
        }
      />
      <QuestionBody gap={22}>
        {last ? (
          <View style={styles.last}>
            <AppText variant="eyebrow">Last time</AppText>
            <AppText variant="bodyMedium">
              {last.challenge || last.outcome}
            </AppText>
          </View>
        ) : null}
        <OptionList>
          {KINDS.map(k => (
            <OptionCard
              key={k.id}
              testID={`challenge-${k.id}`}
              icon={Flame}
              title={k.title}
              description={k.description}
              selected={draft.challengeKind === k.id}
              onPress={() => update({ challengeKind: k.id })}
            />
          ))}
        </OptionList>
        {kind ? (
          <Animated.View
            entering={FadeInDown.duration(motion.base).easing(motion.easeOut)}
            style={styles.say}
          >
            <AppText variant="eyebrow">Exactly how</AppText>
            <TextField
              testID="sheet-challenge"
              accessibilityLabel="Challenge"
              value={draft.challenge}
              onChangeText={challenge => update({ challenge })}
              placeholder={kind.placeholder}
            />
          </Animated.View>
        ) : null}
      </QuestionBody>
    </>
  );
}

const styles = StyleSheet.create({
  last: {
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.stone,
    marginBottom: spacing.xl,
  },
  say: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
