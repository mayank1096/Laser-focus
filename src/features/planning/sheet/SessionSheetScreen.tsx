import React, { useMemo, useState, type ComponentType } from 'react';
import type { ImageSourcePropType } from 'react-native';
import {
  FlowFrame,
  type FlowDirection,
  type FlowTone,
} from '../../../components/FlowFrame';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { formatClock, slotName } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { lastSheetBefore, planFor, usePlanning } from '../store';
import { ChallengeStep } from './ChallengeStep';
import { MIN_TEXT, SheetDraftContext, toSheet, type SheetDraft } from './draft';
import { HowStep } from './HowStep';
import { InversionStep } from './InversionStep';
import { OutcomeStep } from './OutcomeStep';

interface SheetStep {
  id: string;
  Component: ComponentType;
  canContinue: (d: SheetDraft) => boolean;
  art?: ImageSourcePropType;
  tone?: FlowTone;
}

const STEPS: SheetStep[] = [
  {
    id: 'outcome',
    Component: OutcomeStep,
    art: require('../../../assets/images/warrior-standing.jpg'),
    canContinue: d => d.outcome.trim().length >= MIN_TEXT,
  },
  {
    id: 'challenge',
    Component: ChallengeStep,
    art: require('../../../assets/images/warrior-kneeling.jpg'),
    canContinue: d =>
      d.challengeKind !== null && d.challenge.trim().length >= MIN_TEXT,
  },
  {
    id: 'how',
    Component: HowStep,
    canContinue: d => d.steps.length > 0,
  },
  {
    id: 'inversion',
    Component: InversionStep,
    tone: 'blush',
    canContinue: d => d.failureModes.length > 0,
  },
];

/**
 * The session sheet, written the night before: outcome, challenge, how and
 * how long, and what would make it fail. Four short screens.
 */
export function SessionSheetScreen({
  navigation,
  route,
}: RootScreenProps<'SessionSheet'>) {
  const { date, slotId } = route.params;
  const saveSheet = usePlanning(s => s.saveSheet);

  // Read once: the sheet is a draft until it is finished.
  const { session, last } = useMemo(() => {
    const state = usePlanning.getState();
    const view = planFor(state, date).sessions.find(s => s.slot.id === slotId);
    return {
      session: view,
      last: lastSheetBefore(state, date, view?.task?.id ?? null),
    };
  }, [date, slotId]);

  const [draft, setDraft] = useState<SheetDraft>(() => {
    const existing = session?.sheet;
    // A new sheet starts from the last one's method, never its outcome.
    const base = existing ?? last;
    return {
      outcome: existing?.outcome ?? '',
      challengeKind: existing?.challengeKind ?? null,
      challenge: existing?.challenge ?? '',
      steps: base?.steps ?? [],
      minutes: existing?.minutes ?? session?.slot.minutes ?? 90,
      failureModes: base?.failureModes ?? [],
    };
  });
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<FlowDirection>('forward');

  if (!session) {
    return null;
  }
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const tag = `${slotName(session.slot)} · ${formatClock(
    session.slot.start,
  )} · ${session.task?.text ?? 'Session'}`;

  const goTo = (target: number, dir: FlowDirection) => {
    setDirection(dir);
    setIndex(target);
  };

  const finish = () => {
    saveSheet(date, slotId, toSheet(draft));
    haptics.success();
    // Next sheet still to write that day, or on to sealing it.
    const next = planFor(usePlanning.getState(), date).sessions.find(
      s => s.task && !s.sheet,
    );
    if (next) {
      navigation.replace('SessionSheet', { date, slotId: next.slot.id });
    } else {
      navigation.replace('SealDay', { date });
    }
  };

  const { Component } = step;
  return (
    <SheetDraftContext.Provider
      value={{
        draft,
        update: patch => setDraft(d => ({ ...d, ...patch })),
        last,
        tag,
      }}
    >
      <FlowFrame
        testID="session-sheet"
        stepKey={step.id}
        direction={direction}
        art={step.art}
        tone={step.tone}
        onBack={() =>
          index === 0 ? navigation.goBack() : goTo(index - 1, 'back')
        }
        progress={{
          total: STEPS.length,
          filled: index + 1,
          onSegmentPress: i => goTo(i, 'back'),
        }}
        footer={
          <PrimaryButton
            testID="next-button"
            label={isLast ? 'Finish sheet' : 'Next'}
            disabled={!step.canContinue(draft)}
            shadow={step.tone === 'blush' ? 'none' : 'ember'}
            onPress={() => (isLast ? finish() : goTo(index + 1, 'forward'))}
          />
        }
      >
        <Component />
      </FlowFrame>
    </SheetDraftContext.Provider>
  );
}
