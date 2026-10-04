import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import Check from '../../../assets/icons/check.svg';
import { AppText } from '../../../components/AppText';
import type { Priority, Task } from '../../../types/models';
import { colors, motion, spacing } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { isTaskDone } from '../store';

export const PRIORITY_LABEL: Record<Priority, string> = {
  3: 'High',
  2: 'Medium',
  1: 'Low',
};

/** ●●● / ●●○ / ●○○ */
export function PriorityDots({ priority }: { priority: Priority }) {
  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel={`${PRIORITY_LABEL[priority]} priority`}
    >
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[styles.dot, i <= priority ? styles.dotOn : styles.dotOff]}
        />
      ))}
    </View>
  );
}

/** One bar per session needed; done ones in saffron. */
function SessionBars({ task }: { task: Task }) {
  return (
    <View style={styles.bars}>
      {Array.from({ length: task.sessionsNeeded }, (_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            i < task.sessionsDone ? styles.dotOn : styles.dotOff,
          ]}
        />
      ))}
    </View>
  );
}

function deepMeta(task: Task) {
  if (isTaskDone(task)) {
    return `${PRIORITY_LABEL[task.priority]} · Done`;
  }
  const n = task.sessionsNeeded;
  return `${PRIORITY_LABEL[task.priority]} · ${task.sessionsDone} of ${n} ${
    n === 1 ? 'session' : 'sessions'
  }`;
}

/** A deep task on the week list. Tap to edit. */
export function DeepTaskRow({
  task,
  onPress,
}: {
  task: Task;
  onPress: () => void;
}) {
  const done = isTaskDone(task);
  return (
    <Animated.View layout={LinearTransition.duration(motion.base)}>
      <Pressable
        testID={`task-${task.id}`}
        accessibilityRole="button"
        accessibilityHint="Edit this task"
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        style={({ pressed }) => [
          styles.row,
          done && styles.finished,
          pressed && styles.pressed,
        ]}
      >
        <PriorityDots priority={task.priority} />
        <View style={styles.text}>
          <AppText variant="bodyMedium">{task.text}</AppText>
          <AppText variant="micro" style={styles.meta}>
            {deepMeta(task)}
          </AppText>
        </View>
        <SessionBars task={task} />
      </Pressable>
    </Animated.View>
  );
}

/** A shallow task: a tick box and a line. Long-press to edit. */
export function ShallowTaskRow({
  task,
  onToggle,
  onEdit,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const done = isTaskDone(task);
  return (
    <Pressable
      testID={`task-${task.id}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={task.text}
      accessibilityHint="Long press to edit"
      onPress={() => {
        if (done) {
          haptics.selection();
        } else {
          haptics.success();
        }
        onToggle();
      }}
      onLongPress={() => {
        haptics.confirm();
        onEdit();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, done && styles.boxOn]}>
        {done ? (
          <Animated.View entering={FadeIn.duration(motion.fast)}>
            <Check
              width={11}
              height={11}
              color={colors.white}
              strokeWidth={3}
            />
          </Animated.View>
        ) : null}
      </View>
      <AppText
        variant="body"
        style={[styles.text, done && styles.struck]}
        numberOfLines={2}
      >
        {task.text}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg + 1,
  },
  pressed: {
    opacity: 0.6,
  },
  finished: {
    opacity: 0.5,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  meta: {
    color: colors.textMuted,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotOn: {
    backgroundColor: colors.saffron,
  },
  dotOff: {
    backgroundColor: colors.hairline,
  },
  bars: {
    flexDirection: 'row',
    gap: 3,
  },
  bar: {
    width: 12,
    height: 4,
    borderRadius: 2,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  struck: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
});
