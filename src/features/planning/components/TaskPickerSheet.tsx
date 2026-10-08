import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Check from '../../../assets/icons/check.svg';
import Pencil from '../../../assets/icons/pencil.svg';
import { AppText } from '../../../components/AppText';
import { BottomSheet } from '../../../components/BottomSheet';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { TextField } from '../../../components/TextField';
import type { Id, SessionSlot } from '../../../types/models';
import { colors, spacing } from '../../../theme';
import { today } from '../../../utils/clock';
import { formatClock } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { isTaskDone, tasksForWeek, usePlanning } from '../store';
import { PriorityDots } from './TaskRow';
import { SheetTitle } from './SheetTitle';

export interface TaskPickerSheetProps {
  slot: SessionSlot | null;
  selectedId: Id | null;
  onPick: (taskId: Id | null) => void;
  onClose: () => void;
}

/** Choose the one deep task a session is for, or write a new one. */
export function TaskPickerSheet({
  slot,
  selectedId,
  onPick,
  onClose,
}: TaskPickerSheetProps) {
  const state = usePlanning();
  const addTask = usePlanning(s => s.addTask);
  const updateTask = usePlanning(s => s.updateTask);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: Id; text: string } | null>(null);
  useEffect(() => {
    if (slot) {
      setDraft('');
      setEditing(null);
    }
  }, [slot]);

  const saveEdit = () => {
    if (editing && editing.text.trim().length >= 2) {
      updateTask(editing.id, { text: editing.text.trim() });
      haptics.selection();
    }
    setEditing(null);
  };

  const open = useMemo(
    () =>
      tasksForWeek(state, today()).filter(
        t => t.kind === 'deep' && (!isTaskDone(t) || t.id === selectedId),
      ),
    [state, selectedId],
  );

  const addAndPick = () => {
    const id = addTask(
      { text: draft, kind: 'deep', priority: 2, sessionsNeeded: 1 },
      today(),
    );
    onPick(id);
  };

  return (
    <BottomSheet
      visible={slot !== null}
      onClose={onClose}
      accessibilityLabel="Choose a task"
      testID="task-picker"
    >
      <SheetTitle
        title={slot ? `${formatClock(slot.start)} session` : 'Session'}
        subtitle="One task. Nothing else gets this time. Tap the pencil to fix a task."
      />
      <View style={styles.list} accessibilityRole="radiogroup">
        {open.map(task => {
          const selected = task.id === selectedId;
          const left = task.sessionsNeeded - task.sessionsDone;
          if (editing?.id === task.id) {
            return (
              <View key={task.id} style={[styles.option, styles.selected]}>
                <View style={styles.flex}>
                  <TextField
                    testID={`edit-${task.id}`}
                    accessibilityLabel="Task"
                    value={editing.text}
                    onChangeText={text => setEditing({ id: task.id, text })}
                    onSubmitEditing={saveEdit}
                    autoFocus
                    maxLength={70}
                  />
                </View>
                <Pressable
                  testID={`save-${task.id}`}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={saveEdit}
                >
                  <AppText variant="label" style={styles.saffron}>
                    Save
                  </AppText>
                </Pressable>
              </View>
            );
          }
          return (
            <Pressable
              key={task.id}
              testID={`pick-${task.id}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                haptics.selection();
                onPick(task.id);
              }}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <PriorityDots priority={task.priority} />
              <View style={styles.text}>
                <AppText variant="bodyMedium">{task.text}</AppText>
                <AppText variant="micro" style={styles.muted}>
                  {left > 0
                    ? `${left} ${left === 1 ? 'session' : 'sessions'} left`
                    : 'Done'}
                </AppText>
              </View>
              {selected ? (
                <Check
                  width={16}
                  height={16}
                  color={colors.saffron}
                  strokeWidth={2.25}
                />
              ) : null}
              <Pressable
                testID={`edit-open-${task.id}`}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${task.text}`}
                hitSlop={10}
                onPress={() => {
                  haptics.tap();
                  setEditing({ id: task.id, text: task.text });
                }}
                style={styles.edit}
              >
                <Pencil width={15} height={15} color={colors.textMuted} />
              </Pressable>
            </Pressable>
          );
        })}
        {open.length === 0 ? (
          <AppText variant="caption">
            No deep work on this week’s list yet. Write one below.
          </AppText>
        ) : null}
      </View>

      <View style={styles.newTask}>
        <AppText variant="eyebrow">Or a new deep task</AppText>
        <TextField
          testID="picker-new"
          accessibilityLabel="New deep task"
          value={draft}
          onChangeText={setDraft}
          placeholder="Mock 25 — Paper 3, Maths"
          onSubmitEditing={() => draft.trim().length >= 2 && addAndPick()}
          maxLength={70}
        />
        {draft.trim().length >= 2 ? (
          <PrimaryButton
            testID="picker-add"
            label="Add and choose"
            shadow="none"
            onPress={addAndPick}
          />
        ) : null}
      </View>

      {selectedId ? (
        <Pressable
          testID="picker-clear"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.clear}
          onPress={() => {
            haptics.tap();
            onPick(null);
          }}
        >
          <AppText variant="label" style={styles.muted}>
            Leave this session empty
          </AppText>
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  selected: {
    borderColor: colors.saffron,
    backgroundColor: colors.saffronWash,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  muted: {
    color: colors.textMuted,
  },
  saffron: {
    color: colors.saffron,
  },
  flex: {
    flex: 1,
  },
  edit: {
    paddingLeft: spacing.sm,
  },
  newTask: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  clear: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
});
