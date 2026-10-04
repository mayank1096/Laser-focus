import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { art } from '../../../assets/art';
import { AppText } from '../../../components/AppText';
import { FlowFrame, type FlowDirection } from '../../../components/FlowFrame';
import { HoldButton } from '../../../components/HoldButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { colors } from '../../../theme';
import { now } from '../../../utils/clock';
import { formatClock, formatMinutes } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { useGoalSetup } from '../../onboarding/store';
import { planFor, usePlanning } from '../../planning/store';
import { useSessions } from '../store';
import { PRAYERS } from './content';
import { CountdownStep, TratakStep } from './DarkSteps';
import {
  BreatheStep,
  CHECKLIST_COUNT,
  ClearStep,
  EnterStep,
  PrayStep,
  ValuesStep,
} from './LightSteps';

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
 * breathe, pray, read your values, tratak, count down — then begin.
 */
export function RitualScreen({ navigation, route }: RootScreenProps<'Ritual'>) {
  const { date, slotId } = route.params;
  const planning = usePlanning();
  const values = useGoalSetup(s => s.values);
  const start = useSessions(s => s.start);
  const session = planFor(planning, date).sessions.find(
    s => s.slot.id === slotId,
  );

  const [step, setStep] = useState<Step>('enter');
  const [direction, setDirection] = useState<FlowDirection>('forward');
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [prayer, setPrayer] = useState(0);
  const [valuesRead, setValuesRead] = useState(false);

  if (!session?.sheet) {
    return null;
  }
  const sheet = session.sheet;
  const i = ORDER.indexOf(step);
  const go = (to: Step, dir: FlowDirection = 'forward') => {
    setDirection(dir);
    setStep(to);
  };
  const next = () => go(ORDER[i + 1]);

  const begin = () => {
    haptics.heavy();
    start(
      {
        date,
        slotId,
        taskId: session.task?.id ?? null,
        minutes: sheet.minutes,
      },
      now(),
    );
    navigation.replace('InSession');
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
          when={`${formatClock(session.slot.start)} · ${formatMinutes(
            sheet.minutes,
          )}`}
          task={session.task?.text ?? 'Session'}
          sheet={sheet}
        />
      );
      footer = (
        <PrimaryButton
          testID="next-button"
          label="Begin ritual"
          onPress={next}
        />
      );
      break;
    case 'clear': {
      const left = CHECKLIST_COUNT - ticked.size;
      body = (
        <ClearStep
          failureModes={sheet.failureModes}
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
          label={left ? `${left} left` : 'All clear'}
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
            Skip breathing
          </AppText>
        </Pressable>
      );
      break;
    case 'pray':
      body = <PrayStep index={prayer} />;
      footer = (
        <>
          <PrimaryButton
            testID="next-button"
            label={prayer < PRAYERS.length - 1 ? 'Next prayer' : 'Continue'}
            onPress={() =>
              prayer < PRAYERS.length - 1 ? setPrayer(prayer + 1) : next()
            }
          />
          <Pressable
            testID="pray-skip"
            accessibilityRole="button"
            hitSlop={10}
            onPress={next}
            style={styles.link}
          >
            <AppText variant="label" style={styles.muted}>
              Skip prayers
            </AppText>
          </Pressable>
        </>
      );
      break;
    case 'values':
      artwork = art.standing;
      body = (
        <ValuesStep
          lines={values.map(v => v.text)}
          onAllShown={() => setValuesRead(true)}
        />
      );
      footer = valuesRead ? (
        <HoldButton
          testID="values-hold"
          label="Hold to continue"
          onComplete={next}
        />
      ) : (
        <PrimaryButton label="Read slowly" disabled onPress={() => {}} />
      );
      break;
  }

  return (
    <FlowFrame
      testID={`ritual-${step}`}
      stepKey={step}
      direction={direction}
      tone={tone}
      art={artwork}
      progress={step === 'enter' ? undefined : { total: 6, filled: i }}
      onBack={() => (i === 0 ? navigation.goBack() : go(ORDER[i - 1], 'back'))}
      footer={footer}
    >
      {body}
    </FlowFrame>
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
});
