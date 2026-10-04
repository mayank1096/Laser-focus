import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { BottomSheet } from '../../../components/BottomSheet';
import { Chip, ChipRow } from '../../../components/Chip';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { Stepper } from '../../../components/Stepper';
import { TextField } from '../../../components/TextField';
import type { Priority, Task, TaskKind } from '../../../types/models';
import { colors, motion, spacing } from '../../../theme';
import { formatMinutes } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { today } from '../../../utils/clock';
import { PLANNING_LIMITS, usePlanning } from '../store';
import { PRIORITY_LABEL } from './TaskRow';
import { SheetTitle } from './SheetTitle';

export interface TaskSheetProps {
  visible: boolean;
  /** Edit this task; omit to add a new one. */
  task?: Task | null;
  onClose: () => void;
}

const KINDS: { id: TaskKind; label: string }[] = [
  { id: 'deep', label: 'Deep work' },
  { id: 'shallow', label: 'Shallow' },
];
const PRIORITIES: Priority[] = [3, 2, 1];

/** Add or edit a task: what, deep or shallow, how important, how long. */
export function TaskSheet({ visible, task, onClose }: TaskSheetProps) {
  const addTask = usePlanning(s => s.addTask);
  const updateTask = usePlanning(s => s.updateTask);
  const removeTask = usePlanning(s => s.removeTask);
  const slots = usePlanning(s => s.slots);

  const [text, setText] = useState('');
  const [kind, setKind] = useState<TaskKind>('deep');
  const [priority, setPriority] = useState<Priority>(2);
  const [sessions, setSessions] = useState(1);

  // Fresh form each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setText(task?.text ?? '');
      setKind(task?.kind ?? 'deep');
      setPriority(task?.priority ?? 2);
      setSessions(task?.kind === 'deep' ? task.sessionsNeeded : 1);
    }
  }, [visible, task]);

  const canSave = text.trim().length >= 2;
  const save = () => {
    const input = { text, kind, priority, sessionsNeeded: sessions };
    if (task) {
      updateTask(task.id, input);
    } else {
      addTask(input, today());
    }
    haptics.success();
    onClose();
  };

  const sessionLength = Math.round(
    slots.reduce((sum, s) => sum + s.minutes, 0) / Math.max(1, slots.length),
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={task ? 'Edit task' : 'New task'}
      testID="task-sheet"
    >
      <SheetTitle title={task ? 'Edit task' : 'New task'} />
      <TextField
        testID="task-text"
        accessibilityLabel="Task"
        value={text}
        onChangeText={setText}
        placeholder="Mock 25 — Paper 3, Maths"
        autoFocus={!task}
        maxLength={70}
      />

      <Group label="Kind">
        <ChipRow>
          {KINDS.map(k => (
            <Chip
              key={k.id}
              testID={`kind-${k.id}`}
              role="radio"
              label={k.label}
              selected={kind === k.id}
              onPress={() => setKind(k.id)}
            />
          ))}
        </ChipRow>
      </Group>

      <Group label="Priority">
        <ChipRow>
          {PRIORITIES.map(p => (
            <Chip
              key={p}
              testID={`priority-${p}`}
              role="radio"
              label={PRIORITY_LABEL[p]}
              selected={priority === p}
              onPress={() => setPriority(p)}
            />
          ))}
        </ChipRow>
      </Group>

      {kind === 'deep' ? (
        <Animated.View
          entering={FadeIn.duration(motion.fast)}
          exiting={FadeOut.duration(motion.fast)}
        >
          <Group label="Sessions needed">
            <View style={styles.stepperRow}>
              <Stepper
                testID="task-sessions"
                accessibilityLabel="Sessions needed"
                value={sessions}
                min={PLANNING_LIMITS.sessionsPerTask.min}
                max={PLANNING_LIMITS.sessionsPerTask.max}
                onChange={setSessions}
              />
              <AppText variant="caption" style={styles.flex}>
                {`About ${formatMinutes(
                  sessions * sessionLength,
                )} at ${sessionLength} min each`}
              </AppText>
            </View>
          </Group>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(motion.fast)}
          exiting={FadeOut.duration(motion.fast)}
        >
          <AppText variant="caption" style={styles.note}>
            Done in your shallow window. No session needed.
          </AppText>
        </Animated.View>
      )}

      <View style={styles.actions}>
        <PrimaryButton
          testID="task-save"
          label={task ? 'Save' : 'Add task'}
          shadow="none"
          disabled={!canSave}
          onPress={save}
        />
        {task ? (
          <Pressable
            testID="task-remove"
            accessibilityRole="button"
            onPress={() => {
              haptics.warning();
              removeTask(task.id);
              onClose();
            }}
            style={styles.remove}
            hitSlop={8}
          >
            <AppText variant="label" style={styles.removeText}>
              Remove task
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="eyebrow">{label}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: spacing.xl + spacing.xs,
    gap: spacing.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  note: {
    marginTop: spacing.xl + spacing.xs,
  },
  actions: {
    marginTop: spacing.xxl + spacing.md,
    gap: spacing.xl,
  },
  remove: {
    alignSelf: 'center',
  },
  removeText: {
    color: colors.danger,
  },
});
