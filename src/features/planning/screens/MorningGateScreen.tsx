import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Chip, ChipRow } from '../../../components/Chip';
import { FlowFrame } from '../../../components/FlowFrame';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { TextField } from '../../../components/TextField';
import type { Id } from '../../../types/models';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, spacing } from '../../../theme';
import { formatClock } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { MIN_TEXT } from '../sheet/draft';
import {
  DEFAULT_FAILURE_MODES,
  isTaskDone,
  lastSheetBefore,
  planFor,
  SLOT_LENGTHS,
  tasksForWeek,
  usePlanning,
} from '../store';

/**
 * A session without a sheet does not start. This is the two-minute sheet:
 * the same four questions, one screen, then begin.
 */
export function MorningGateScreen({
  navigation,
  route,
}: RootScreenProps<'MorningGate'>) {
  const { date, slotId } = route.params;
  const state = usePlanning();
  const assignTask = usePlanning(s => s.assignTask);
  const saveSheet = usePlanning(s => s.saveSheet);
  const session = planFor(state, date).sessions.find(s => s.slot.id === slotId);

  const options = useMemo(
    () =>
      tasksForWeek(state, date)
        .filter(t => t.kind === 'deep' && !isTaskDone(t))
        .slice(0, 4),
    [state, date],
  );
  const last = lastSheetBefore(state, date, session?.task?.id ?? null);

  const [taskId, setTaskId] = useState<Id | null>(session?.task?.id ?? null);
  const [outcome, setOutcome] = useState('');
  const [challenge, setChallenge] = useState('');
  const [minutes, setMinutes] = useState(session?.slot.minutes ?? 90);
  const [failures, setFailures] = useState<string[]>([]);

  if (!session) {
    return null;
  }
  const task = state.tasks.find(t => t.id === taskId) ?? null;

  const missing = !task
    ? 'Choose what this session is for'
    : outcome.trim().length < MIN_TEXT
    ? 'Write what will be finished'
    : challenge.trim().length < MIN_TEXT
    ? 'Make it one step harder'
    : failures.length === 0
    ? 'Pick one way you could fail'
    : null;

  const begin = () => {
    if (!task) {
      return;
    }
    if (session.task?.id !== task.id) {
      assignTask(date, slotId, task.id);
    }
    saveSheet(date, slotId, {
      outcome: outcome.trim(),
      challenge: challenge.trim(),
      steps: last?.steps ?? [],
      minutes,
      failureModes: failures,
    });
    haptics.success();
    navigation.replace('Ritual', { date, slotId });
  };

  const lengths = Array.from(
    new Set<number>([
      ...SLOT_LENGTHS.filter(m => m >= 60),
      session.slot.minutes,
    ]),
  ).sort((a, b) => a - b);
  const modes = Array.from(
    new Set([...(last?.failureModes ?? []), ...DEFAULT_FAILURE_MODES]),
  ).slice(0, 5);

  let n = 0;
  const label = (text: string) => `${++n} · ${text}`;

  return (
    <FlowFrame
      testID="morning-gate"
      stepKey="gate"
      direction="forward"
      onBack={() => navigation.goBack()}
      footer={
        <>
          <PrimaryButton
            testID="gate-begin"
            label="Begin session"
            disabled={missing !== null}
            onPress={begin}
          />
          <AppText variant="micro" style={styles.hint}>
            {missing ?? 'Phone away. Door closed.'}
          </AppText>
        </>
      }
    >
      <QuestionHeader
        eyebrow={`${formatClock(session.slot.start)}${
          session.task ? ` · ${session.task.text}` : ''
        }`}
        title="No sheet, no session."
        subtitle="Two minutes. Write it, then begin."
      />
      <QuestionBody gap={24}>
        <View style={styles.form}>
          {!session.task ? (
            <Question label={label('This session is for')}>
              <ChipRow>
                {options.map(t => (
                  <Chip
                    key={t.id}
                    testID={`gate-task-${t.id}`}
                    role="radio"
                    label={t.text}
                    selected={taskId === t.id}
                    onPress={() => setTaskId(t.id)}
                  />
                ))}
              </ChipRow>
              {options.length === 0 ? (
                <AppText variant="caption">
                  No deep work on this week’s list. Add one in Tasks first.
                </AppText>
              ) : null}
            </Question>
          ) : null}
          <Question label={label('Outcome')}>
            <TextField
              testID="gate-outcome"
              accessibilityLabel="Outcome"
              value={outcome}
              onChangeText={setOutcome}
              placeholder={
                task ? `${task.text}, finished` : 'What will be finished?'
              }
            />
          </Question>
          <Question label={label('One step harder')}>
            <TextField
              testID="gate-challenge"
              accessibilityLabel="Challenge"
              value={challenge}
              onChangeText={setChallenge}
              placeholder={
                last?.challenge || 'Faster, better or harder than last time'
              }
            />
          </Question>
          <Question label={label('How long')}>
            <ChipRow>
              {lengths.map(m => (
                <Chip
                  key={m}
                  testID={`gate-length-${m}`}
                  role="radio"
                  label={`${m} min`}
                  selected={minutes === m}
                  onPress={() => setMinutes(m)}
                />
              ))}
            </ChipRow>
          </Question>
          <Question label={label('Failure will come from')}>
            <ChipRow>
              {modes.map(mode => (
                <Chip
                  key={mode}
                  testID={`gate-failure-${mode}`}
                  role="checkbox"
                  label={mode}
                  selected={failures.includes(mode)}
                  onPress={() =>
                    setFailures(f =>
                      f.includes(mode)
                        ? f.filter(x => x !== mode)
                        : [...f, mode],
                    )
                  }
                />
              ))}
            </ChipRow>
          </Question>
        </View>
      </QuestionBody>
    </FlowFrame>
  );
}

function Question({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.question}>
      <AppText variant="eyebrow">{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.xl,
  },
  question: {
    gap: spacing.md,
  },
  hint: {
    textAlign: 'center',
    color: colors.textFaint,
  },
});
