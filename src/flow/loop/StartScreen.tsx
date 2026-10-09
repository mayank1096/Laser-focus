import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { FlowFrame, type FlowDirection } from '../../components/FlowFrame';
import { HoldButton } from '../../components/HoldButton';
import { PrimaryButton } from '../../components/PrimaryButton';
import { sessionsOn } from '../../core/home';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { SheetTitle } from '../components/SheetTitle';
import { CountdownStep, TratakStep } from '../ritual/DarkSteps';
import {
  BreatheStep,
  checklistCount,
  ClearStep,
  EnterStep,
  PrayStep,
  ValuesStep,
} from '../ritual/LightSteps';

type Step =
  | 'enter'
  | 'clear'
  | 'breathe'
  | 'pray'
  | 'values'
  | 'tratak'
  | 'countdown';
const ORDER: Step[] = [
  'enter',
  'clear',
  'breathe',
  'pray',
  'values',
  'tratak',
  'countdown',
];

/**
 * The Laser Focus Ritual, before every session: enter, clear the field,
 * breathe, pray, read your values, tratak, count down — then the session
 * starts and the dial takes over.
 */
export function StartScreen({ navigation, route }: RootScreenProps<'Start'>) {
  const t = useT();
  const session = useBook(s => s.sessions.find(x => x.id === route.params.id));
  const dayCount = useBook(s =>
    session ? sessionsOn(s, session.date).length : 0,
  );
  const values = useBook(s => s.values);
  const [step, setStep] = useState<Step>('enter');
  const [direction, setDirection] = useState<FlowDirection>('forward');
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [prayer, setPrayer] = useState(0);
  const [valuesRead, setValuesRead] = useState(false);
  const [notFeeling, setNotFeeling] = useState(false);

  if (!session) {
    return null;
  }
  const i = ORDER.indexOf(step);
  const go = (to: Step, dir: FlowDirection = 'forward') => {
    setDirection(dir);
    setStep(to);
  };
  const next = () => go(ORDER[i + 1]);

  const begin = () => {
    haptics.heavy();
    useBook.getState().startSession(session.id);
    navigation.replace('InProgress', { id: session.id });
  };

  if (step === 'tratak') {
    return <TratakStep onDone={next} />;
  }
  if (step === 'countdown') {
    return <CountdownStep onDone={begin} />;
  }

  let footer: React.ReactNode = null;
  let body: React.ReactNode = null;
  let tone: 'light' | 'parchment' = 'light';
  let artwork;

  switch (step) {
    case 'enter':
      artwork = art.standing;
      body = (
        <EnterStep
          when={`${t.start.header(session.order + 1, dayCount)} · ${clock(
            t,
            session.start,
          )} · ${t.common.minutes(session.minutes)}`}
          task={session.what}
          outcome={session.outcome}
          challenge={session.challenge}
        />
      );
      footer = (
        <>
          <PrimaryButton
            testID="next-button"
            label={t.ritual.begin}
            onPress={next}
          />
          <Pressable
            testID="not-feeling"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setNotFeeling(true)}
            style={styles.link}
          >
            <AppText variant="label" style={styles.muted}>
              {t.start.notFeeling}
            </AppText>
          </Pressable>
        </>
      );
      break;
    case 'clear': {
      const left = checklistCount(t.ritual.checklist) - ticked.size;
      body = (
        <ClearStep
          failureModes={session.dontDo ?? []}
          ticked={ticked}
          onToggle={item =>
            setTicked(prev => {
              const nextSet = new Set(prev);
              if (nextSet.has(item)) {
                nextSet.delete(item);
              } else {
                nextSet.add(item);
              }
              return nextSet;
            })
          }
        />
      );
      footer = (
        <PrimaryButton
          testID="next-button"
          label={left ? t.ritual.left(left) : t.ritual.allClear}
          disabled={left > 0}
          onPress={next}
        />
      );
      break;
    }
    case 'breathe':
      tone = 'parchment';
      body = <BreatheStep onDone={next} />;
      footer = (
        <Pressable
          testID="breathe-skip"
          accessibilityRole="button"
          hitSlop={10}
          onPress={next}
          style={styles.link}
        >
          <AppText variant="label" style={styles.muted}>
            {t.ritual.skipBreathing}
          </AppText>
        </Pressable>
      );
      break;
    case 'pray': {
      const last = t.ritual.prayers.length - 1;
      body = <PrayStep index={prayer} />;
      footer = (
        <>
          <PrimaryButton
            testID="next-button"
            label={prayer < last ? t.ritual.nextPrayer : t.ritual.continue}
            onPress={() => (prayer < last ? setPrayer(prayer + 1) : next())}
          />
          <Pressable
            testID="pray-skip"
            accessibilityRole="button"
            hitSlop={10}
            onPress={next}
            style={styles.link}
          >
            <AppText variant="label" style={styles.muted}>
              {t.ritual.skipPrayers}
            </AppText>
          </Pressable>
        </>
      );
      break;
    }
    case 'values':
      artwork = art.standing;
      body = (
        <ValuesStep
          lines={values.map(v => v.text).filter(Boolean)}
          onAllShown={() => setValuesRead(true)}
        />
      );
      footer = valuesRead ? (
        <HoldButton
          testID="values-hold"
          label={t.ritual.holdContinue}
          onComplete={next}
        />
      ) : (
        <PrimaryButton
          label={t.ritual.readSlowly}
          disabled
          onPress={() => {}}
        />
      );
      break;
  }

  return (
    <>
      <FlowFrame
        testID={`ritual-${step}`}
        stepKey={step}
        direction={direction}
        tone={tone}
        art={artwork}
        progress={step === 'enter' ? undefined : { total: 6, filled: i }}
        onBack={() =>
          i === 0 ? navigation.goBack() : go(ORDER[i - 1], 'back')
        }
        footer={footer}
      >
        {body}
      </FlowFrame>

      <BottomSheet
        visible={notFeeling}
        onClose={() => setNotFeeling(false)}
        accessibilityLabel={t.start.notFeelingTitle}
      >
        <SheetTitle title={t.start.notFeelingTitle} />
        <View style={styles.answers}>
          <AppText variant="body">{`1.  ${t.start.notFeelingOne}`}</AppText>
          <AppText variant="body">{`2.  ${t.start.notFeelingTwo}`}</AppText>
        </View>
        <PrimaryButton
          label={t.start.backToStart}
          shadow="none"
          onPress={() => setNotFeeling(false)}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  muted: {
    color: colors.textMuted,
  },
  answers: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
