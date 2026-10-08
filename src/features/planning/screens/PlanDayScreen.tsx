import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { FlowFrame } from '../../../components/FlowFrame';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import type { RootScreenProps } from '../../../navigation/types';
import type { SessionSlot } from '../../../types/models';
import { colors, motion, spacing } from '../../../theme';
import { today } from '../../../utils/clock';
import {
  addDays,
  formatClock,
  formatDay,
  formatWindow,
  slotName,
} from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { SlotSheet } from '../components/SlotSheet';
import { TaskPickerSheet } from '../components/TaskPickerSheet';
import { AddRow } from '../setup/SessionTimesStep';
import {
  isReadyToSeal,
  isTaskDone,
  PLANNING_LIMITS,
  planFor,
  tasksForWeek,
  usePlanning,
  type SessionView,
} from '../store';

const ORDINAL = ['first', 'second', 'third'];

/** Give each of the day's sessions one task, then write their sheets. */
export function PlanDayScreen({
  navigation,
  route,
}: RootScreenProps<'PlanDay'>) {
  const { date } = route.params;
  const state = usePlanning();
  const assignTask = usePlanning(s => s.assignTask);
  const addSlot = usePlanning(s => s.addSlot);
  const [picking, setPicking] = useState<SessionView | null>(null);
  const [editingSlot, setEditingSlot] = useState<SessionSlot | null>(null);

  const day = planFor(state, date);
  const isTomorrow = date === addDays(today(), 1);
  const planned = day.sessions.filter(s => s.task);
  const missing = planned.find(s => !s.sheet);
  const shallow = tasksForWeek(state, date).filter(
    t => t.kind === 'shallow' && !isTaskDone(t),
  );

  const writeSheet = (slotId: string) =>
    navigation.navigate('SessionSheet', { date, slotId });

  let footer: React.ReactNode;
  if (day.sealedAt) {
    footer = (
      <PrimaryButton
        testID="plan-cta"
        label="Done"
        onPress={() => navigation.goBack()}
      />
    );
  } else if (missing) {
    footer = (
      <PrimaryButton
        testID="plan-cta"
        label={`Write the ${formatClock(missing.slot.start)} sheet`}
        onPress={() => writeSheet(missing.slot.id)}
      />
    );
  } else {
    footer = (
      <PrimaryButton
        testID="plan-cta"
        label={isTomorrow ? 'Seal tomorrow' : 'Seal the day'}
        disabled={!isReadyToSeal(day)}
        onPress={() => navigation.navigate('SealDay', { date })}
      />
    );
  }

  return (
    <FlowFrame
      testID="plan-day"
      stepKey="plan"
      direction="forward"
      tone="parchment"
      onBack={() => navigation.goBack()}
      footer={footer}
    >
      <QuestionHeader
        eyebrow={`${isTomorrow ? 'Tomorrow · ' : ''}${formatDay(date)}`}
        title={isTomorrow ? 'Plan tomorrow' : `Plan ${formatDay(date)}`}
        subtitle={
          day.sealedAt
            ? 'Sealed. Change anything and it opens again.'
            : 'One task per session. Each one gets a sheet.'
        }
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          {day.sessions.map(session => (
            <SlotCard
              key={session.slot.id}
              session={session}
              onEditSlot={() => setEditingSlot(session.slot)}
              onPick={() => setPicking(session)}
              onWrite={() => writeSheet(session.slot.id)}
            />
          ))}
          {day.sessions.length < PLANNING_LIMITS.slots.max ? (
            <Animated.View layout={LinearTransition.duration(motion.base)}>
              <AddRow
                testID="plan-add-slot"
                label={`+  Add a ${ORDINAL[day.sessions.length]} session`}
                onPress={() => {
                  if (addSlot()) {
                    setEditingSlot(usePlanning.getState().slots.at(-1) ?? null);
                  }
                }}
              />
            </Animated.View>
          ) : null}
          <Animated.View
            layout={LinearTransition.duration(motion.base)}
            style={styles.shallow}
          >
            <AppText variant="eyebrow">
              {`Shallow · ${formatWindow(
                state.shallowWindow.start,
                state.shallowWindow.end,
              )}`}
            </AppText>
            <AppText variant="body">
              {shallow.length
                ? shallow.map(t => t.text).join(' · ')
                : 'Nothing small waiting.'}
            </AppText>
          </Animated.View>
        </View>
      </QuestionBody>

      <TaskPickerSheet
        slot={picking?.slot ?? null}
        selectedId={picking?.task?.id ?? null}
        onClose={() => setPicking(null)}
        onPick={taskId => {
          if (picking) {
            assignTask(date, picking.slot.id, taskId);
          }
          setPicking(null);
        }}
      />
      <SlotSheet slot={editingSlot} onClose={() => setEditingSlot(null)} />
    </FlowFrame>
  );
}

function SlotCard({
  session,
  onEditSlot,
  onPick,
  onWrite,
}: {
  session: SessionView;
  onEditSlot: () => void;
  onPick: () => void;
  onWrite: () => void;
}) {
  const { slot, task, sheet } = session;
  const needsSheet = task && !sheet;
  return (
    <Animated.View
      layout={LinearTransition.duration(motion.base)}
      entering={FadeInDown.duration(motion.base).easing(motion.easeOut)}
      exiting={FadeOut.duration(motion.fast)}
      style={[styles.card, needsSheet && styles.cardOpen]}
    >
      <Pressable
        testID={`plan-time-${slot.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${slotName(slot)} session at ${formatClock(
          slot.start,
        )}`}
        accessibilityHint="Rename it or change its time"
        hitSlop={6}
        onPress={() => {
          haptics.tap();
          onEditSlot();
        }}
        style={styles.time}
      >
        <AppText variant="eyebrow" numberOfLines={1}>
          {slotName(slot)}
        </AppText>
        <AppText variant="bodyBold">{formatClock(slot.start)}</AppText>
        <AppText variant="micro" style={styles.muted}>
          {`${slot.minutes} min`}
        </AppText>
      </Pressable>
      <View style={styles.rule} />
      <View style={styles.body}>
        <Pressable
          testID={`plan-slot-${slot.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${formatClock(slot.start)}: ${
            task?.text ?? 'no task'
          }`}
          accessibilityHint="Choose the task for this session"
          hitSlop={6}
          onPress={() => {
            haptics.tap();
            onPick();
          }}
        >
          <AppText
            variant="bodyMedium"
            style={!task && styles.placeholder}
            numberOfLines={2}
          >
            {task?.text ?? 'Choose a task'}
          </AppText>
        </Pressable>
        {task ? (
          <Pressable
            testID={`plan-sheet-${slot.id}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              haptics.tap();
              onWrite();
            }}
          >
            <AppText
              variant="micro"
              style={{ color: sheet ? colors.textMuted : colors.saffron }}
            >
              {sheet ? '✓  Sheet written · Edit' : 'Sheet needed  →'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  cardOpen: {
    borderColor: colors.saffron,
  },
  time: {
    width: 78,
    gap: spacing.xxs,
  },
  muted: {
    color: colors.textMuted,
  },
  rule: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.hairline,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  placeholder: {
    color: colors.textFaint,
  },
  shallow: {
    gap: spacing.xs,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.stone,
  },
});
