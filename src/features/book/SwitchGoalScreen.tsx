import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { art } from '../../assets/art';
import Flame from '../../assets/icons/flame.svg';
import MapIcon from '../../assets/icons/map.svg';
import Pause from '../../assets/icons/pause.svg';
import { AppText } from '../../components/AppText';
import { FlowFrame, type FlowDirection } from '../../components/FlowFrame';
import { HoldButton } from '../../components/HoldButton';
import { OptionCard, OptionList } from '../../components/OptionCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
  rise,
} from '../../components/QuestionHeader';
import { TextField } from '../../components/TextField';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { now } from '../../utils/clock';
import { useGoalSetup } from '../onboarding/store';
import { useGoalProgress, useStreak } from '../progress';

type Step = 'choose' | 'reread' | 'confirm';
const ORDER: Step[] = ['choose', 'reread', 'confirm'];
const SINCE = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});

/**
 * Switching the Magic Circle goal, made deliberate: choose, reread the
 * anti-goals and say why, then hold to confirm. Never offered on Home.
 */
export function SwitchGoalScreen({
  navigation,
}: RootScreenProps<'SwitchGoal'>) {
  const { goals, antiGoals, completedAt, switchGoal } = useGoalSetup();
  const progress = useGoalProgress();
  const streak = useStreak();
  const current = goals.find(g => g.isPrimary);
  const others = goals.filter(g => !g.isPrimary);
  const [to, setTo] = useState(others[0]?.id ?? null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<Step>('choose');
  const [direction, setDirection] = useState<FlowDirection>('forward');
  const target = goals.find(g => g.id === to);
  const i = ORDER.indexOf(step);

  const go = (next: Step, dir: FlowDirection) => {
    setDirection(dir);
    setStep(next);
  };

  let footer: React.ReactNode;
  if (step === 'confirm') {
    footer = (
      <>
        <HoldButton
          testID="switch-hold"
          label="Hold to switch"
          duration={3000}
          onComplete={() => {
            if (!to) {
              return;
            }
            const needsPlan = switchGoal(
              to,
              reason.trim(),
              now().toISOString(),
            );
            navigation.reset({
              index: 0,
              routes: [{ name: needsPlan ? 'PlanNextGoal' : 'Main' }],
            });
          }}
        />
        <AppText variant="micro" style={styles.hint}>
          Hold for 3 seconds
        </AppText>
      </>
    );
  } else {
    footer = (
      <PrimaryButton
        testID="next-button"
        label="Next"
        shadow={step === 'reread' ? 'none' : 'ember'}
        disabled={step === 'choose' ? !to : reason.trim().length < 3}
        onPress={() => go(ORDER[i + 1], 'forward')}
      />
    );
  }

  return (
    <FlowFrame
      testID="switch-goal"
      stepKey={step}
      direction={direction}
      tone={step === 'reread' ? 'blush' : 'light'}
      art={step === 'choose' ? art.arrows : undefined}
      onBack={() => (i === 0 ? navigation.goBack() : go(ORDER[i - 1], 'back'))}
      footer={footer}
    >
      {step === 'choose' ? (
        <>
          <QuestionHeader
            eyebrow="Switch Magic Circle"
            title="Which goal comes first now?"
            subtitle={`${
              current?.text ?? 'Your goal'
            } will pause. Its progress is kept.`}
          />
          <QuestionBody>
            <OptionList>
              {others.map(g => (
                <OptionCard
                  key={g.id}
                  testID={`switch-to-${g.id}`}
                  title={g.text}
                  description={
                    completedAt
                      ? `Waiting since ${SINCE.format(new Date(completedAt))}`
                      : 'Waiting its turn'
                  }
                  selected={to === g.id}
                  onPress={() => setTo(g.id)}
                />
              ))}
            </OptionList>
          </QuestionBody>
        </>
      ) : null}

      {step === 'reread' ? (
        <>
          <QuestionHeader
            eyebrow="Before you switch"
            title="Read what you wrote. Slowly."
          />
          <QuestionBody gap={26}>
            <View style={styles.lines}>
              {antiGoals.map((a, k) => (
                <Animated.View
                  key={a.id}
                  entering={rise(4 + k)}
                  style={styles.line}
                >
                  <AppText variant="body" style={styles.center}>
                    {a.text}
                  </AppText>
                </Animated.View>
              ))}
            </View>
            <View style={styles.why}>
              <AppText variant="eyebrow">Why now?</AppText>
              <TextField
                testID="switch-reason"
                accessibilityLabel="Why now"
                value={reason}
                onChangeText={setReason}
                placeholder="My exam moved to next year."
                multiline
              />
              <AppText variant="caption">
                Only you will read this. It is saved with the switch.
              </AppText>
            </View>
          </QuestionBody>
        </>
      ) : null}

      {step === 'confirm' && target ? (
        <>
          <QuestionHeader
            eyebrow="Switch Magic Circle"
            title={`${target.text} comes first now.`}
          />
          <QuestionBody gap={26}>
            <View style={styles.changes}>
              <Change
                Icon={Pause}
                title={`${current?.text ?? 'Your goal'} pauses`}
                detail={`${progress.done} of ${progress.total} ${progress.noun} are kept. It goes back in line.`}
              />
              <Change
                Icon={Flame}
                title="Your streak continues"
                detail={`Day ${streak} stays Day ${streak}. Focus is focus.`}
              />
              <Change
                Icon={MapIcon}
                title="Plan the new goal next"
                detail="Action, how many, by when, steps. About 2 minutes."
                last
              />
            </View>
          </QuestionBody>
        </>
      ) : null}
    </FlowFrame>
  );
}

function Change({
  Icon,
  title,
  detail,
  last,
}: {
  Icon: React.FC<{
    width: number;
    height: number;
    color: string;
    strokeWidth: number;
  }>;
  title: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.change, !last && styles.divider]}>
      <Icon width={20} height={20} color={colors.ink} strokeWidth={1.6} />
      <View style={styles.flex}>
        <AppText variant="bodyMedium">{title}</AppText>
        <AppText variant="micro" style={styles.muted}>
          {detail}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lines: {
    gap: spacing.md,
  },
  line: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.blushDeep,
  },
  center: {
    textAlign: 'center',
  },
  why: {
    marginTop: 28,
    gap: spacing.md,
  },
  changes: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  change: {
    flexDirection: 'row',
    gap: 14,
    padding: spacing.xl,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  flex: {
    flex: 1,
    gap: spacing.xs,
  },
  muted: {
    color: colors.textMuted,
  },
  hint: {
    textAlign: 'center',
    color: colors.textFaint,
  },
});
