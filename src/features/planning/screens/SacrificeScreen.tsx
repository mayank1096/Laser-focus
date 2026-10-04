import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { FlowFrame, type FlowDirection } from '../../../components/FlowFrame';
import { ListField } from '../../../components/ListField';
import {
  OutlineButton,
  PrimaryButton,
} from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
  rise,
} from '../../../components/QuestionHeader';
import type { RootScreenProps } from '../../../navigation/types';
import type { SheetLine } from '../../../types/models';
import { colors, spacing } from '../../../theme';
import { now } from '../../../utils/clock';
import { haptics } from '../../../utils/haptics';
import { PLANNING_LIMITS, usePlanning } from '../store';

type Step = 'write' | 'twist';

/**
 * Asked once the first week is done: what you'll give up, and what you'll
 * keep no matter what. Then the twist — someone out there is giving up what
 * you kept.
 */
export function SacrificeScreen({ navigation }: RootScreenProps<'Sacrifice'>) {
  const saved = usePlanning(s => s.sacrifice);
  const saveSacrifice = usePlanning(s => s.saveSacrifice);
  const [giveUp, setGiveUp] = useState<SheetLine[]>(saved?.giveUp ?? []);
  const [keep, setKeep] = useState<SheetLine[]>(saved?.keep ?? []);
  const [step, setStep] = useState<Step>('write');
  const [direction, setDirection] = useState<FlowDirection>('forward');
  // The twist lands once; after a redo, Next saves.
  const [twistSeen, setTwistSeen] = useState(saved !== null);

  const canContinue =
    giveUp.length >= PLANNING_LIMITS.giveUp.min &&
    keep.length >= PLANNING_LIMITS.keep.min;

  const save = () => {
    saveSacrifice(giveUp, keep, now().toISOString());
    haptics.success();
    navigation.goBack();
  };

  const go = (next: Step, dir: FlowDirection) => {
    setDirection(dir);
    setStep(next);
  };

  return (
    <FlowFrame
      testID="sacrifice"
      stepKey={step}
      direction={direction}
      tone={step === 'twist' ? 'blush' : 'light'}
      onBack={() =>
        step === 'twist' ? go('write', 'back') : navigation.goBack()
      }
      footer={
        step === 'write' ? (
          <PrimaryButton
            testID="next-button"
            label={twistSeen ? 'Save sheet' : 'Next'}
            disabled={!canContinue}
            onPress={() => {
              if (twistSeen) {
                save();
              } else {
                setTwistSeen(true);
                haptics.confirm();
                go('twist', 'forward');
              }
            }}
          />
        ) : (
          <>
            <PrimaryButton
              testID="sacrifice-redo"
              label="Redo my sheet"
              shadow="none"
              onPress={() => go('write', 'back')}
            />
            <OutlineButton
              testID="sacrifice-keep"
              label="Keep my list"
              onPress={save}
            />
          </>
        )
      }
    >
      {step === 'write' ? (
        <>
          <QuestionHeader
            eyebrow="Week 1 done · Sacrifice sheet"
            title="What will you give up?"
            subtitle="And what you’ll keep, no matter what."
          />
          <QuestionBody gap={26}>
            <View style={styles.group}>
              <AppText variant="eyebrow">I give up</AppText>
              <ListField
                testID="giveup-list"
                items={giveUp}
                onChange={setGiveUp}
                max={PLANNING_LIMITS.giveUp.max}
                addLabel="Add something to give up"
                placeholder="Instagram before 8 PM"
                idPrefix="giveup"
              />
            </View>
            <View style={[styles.group, styles.second]}>
              <AppText variant="eyebrow">I keep</AppText>
              <ListField
                testID="keep-list"
                items={keep}
                onChange={setKeep}
                max={PLANNING_LIMITS.keep.max}
                addLabel="Add something you keep"
                placeholder="Sunday lunch with family"
                idPrefix="keep"
              />
            </View>
          </QuestionBody>
        </>
      ) : (
        <>
          <QuestionHeader
            eyebrow="Sacrifice sheet"
            title="Someone wants it more."
            subtitle="Whoever beats you is giving up what you kept."
          />
          <QuestionBody gap={26}>
            <View style={styles.kept}>
              {keep.map((line, i) => (
                <Animated.View
                  key={line.id}
                  entering={rise(4 + i)}
                  style={styles.keptLine}
                >
                  <AppText variant="body" style={styles.center}>
                    {line.text}
                  </AppText>
                </Animated.View>
              ))}
            </View>
            <Animated.View entering={rise(5 + keep.length)}>
              <AppText variant="caption" style={styles.ask}>
                Still keeping them? Both answers are allowed.
              </AppText>
            </Animated.View>
          </QuestionBody>
        </>
      )}
    </FlowFrame>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  second: {
    marginTop: 26,
  },
  kept: {
    gap: spacing.md,
  },
  keptLine: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.blushDeep,
  },
  center: {
    textAlign: 'center',
  },
  ask: {
    marginTop: spacing.lg,
  },
});
