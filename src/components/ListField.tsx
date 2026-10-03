import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import type { SheetLine } from '../types/models';
import { colors, layout, motion, radii, spacing, typography } from '../theme';
import { createId } from '../utils/id';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';

const NEW = '__new__';
const FOCUS_DELAY = 60;

export interface ListFieldProps {
  items: SheetLine[];
  onChange: (items: SheetLine[]) => void;
  max: number;
  /** Text on the dashed "add" row, e.g. "Add a new Value". */
  addLabel: string;
  /** Placeholder while typing a new line. */
  placeholder?: string;
  /** Optional element shown to the right of each row (e.g. a month chip). */
  renderTrailing?: (item: SheetLine, index: number) => ReactNode;
  idPrefix?: string;
  testID?: string;
}

const layoutTransition = LinearTransition.springify()
  .damping(motion.spring.damping)
  .stiffness(motion.spring.stiffness);

/**
 * An editable list of short lines, used by every "sheet" question.
 *
 * - Tap the dashed row to add a line. Pressing return saves it and opens the
 *   next empty line, so several lines can be typed in one go.
 * - Tap a saved line to edit it. Clearing it removes it.
 * - The add row disappears once `max` lines exist.
 */
export function ListField({
  items,
  onChange,
  max,
  addLabel,
  placeholder,
  renderTrailing,
  idPrefix = 'line',
  testID,
}: ListFieldProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // Bumped to give a fresh input when typing several new lines in a row.
  const [newSession, setNewSession] = useState(0);
  // Commits can arrive from a blur after the parent re-rendered; always work
  // from the latest list.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const commitLine = (id: string, raw: string): SheetLine[] => {
    const current = itemsRef.current;
    const text = raw.trim();
    let next = current;

    if (id === NEW) {
      if (text && current.length < max) {
        next = [...current, { id: createId(idPrefix), text }];
        haptics.selection();
      }
    } else if (!text) {
      next = current.filter(item => item.id !== id);
    } else {
      next = current.map(item => (item.id === id ? { ...item, text } : item));
    }

    if (next !== current) {
      itemsRef.current = next;
      onChange(next);
    }
    return next;
  };

  const handleCommit = (id: string, text: string, via: CommitReason) => {
    const next = commitLine(id, text);
    if (via === 'submit' && id === NEW && text.trim() && next.length < max) {
      // Keep the keyboard up for the next line.
      setNewSession(n => n + 1);
      return;
    }
    // Only close if the user has not already moved on to another line.
    setEditingId(current => (current === id ? null : current));
    if (via === 'submit') {
      Keyboard.dismiss();
    }
  };

  const canAdd = items.length < max && editingId !== NEW;

  return (
    <View style={styles.list} testID={testID}>
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          style={styles.row}
          layout={layoutTransition}
          entering={FadeInDown.duration(motion.base).easing(motion.easeOut)}
          exiting={FadeOut.duration(motion.fast)}
        >
          {editingId === item.id ? (
            <LineInput
              initialValue={item.text}
              placeholder={placeholder}
              onCommit={(text, via) => handleCommit(item.id, text, via)}
            />
          ) : (
            <Pressable
              style={[styles.field, styles.saved]}
              onPress={() => setEditingId(item.id)}
              accessibilityRole="button"
              accessibilityHint="Edit this line"
            >
              <AppText variant="body" style={styles.centered}>
                {item.text}
              </AppText>
            </Pressable>
          )}
          {renderTrailing?.(item, index)}
        </Animated.View>
      ))}

      {editingId === NEW && (
        <Animated.View
          key={`${NEW}${newSession}`}
          style={styles.row}
          layout={layoutTransition}
          entering={FadeIn.duration(motion.fast)}
          exiting={FadeOut.duration(motion.fast)}
        >
          <LineInput
            initialValue=""
            placeholder={placeholder}
            onCommit={(text, via) => handleCommit(NEW, text, via)}
            testID={testID ? `${testID}-input` : undefined}
          />
        </Animated.View>
      )}

      {canAdd && (
        <Animated.View
          layout={layoutTransition}
          entering={FadeIn.duration(motion.base)}
          exiting={FadeOut.duration(motion.fast)}
        >
          <Pressable
            style={[styles.field, styles.add]}
            onPress={() => {
              haptics.tap();
              setEditingId(NEW);
            }}
            accessibilityRole="button"
            testID={testID ? `${testID}-add` : undefined}
          >
            <AppText variant="body" style={[styles.centered, styles.addLabel]}>
              {addLabel}
            </AppText>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

type CommitReason = 'submit' | 'blur';

/**
 * Owns its own text so a late blur can never save another line's draft.
 * Reports exactly once per editing session.
 */
function LineInput({
  initialValue,
  placeholder,
  onCommit,
  testID,
}: {
  initialValue: string;
  placeholder?: string;
  onCommit: (text: string, via: CommitReason) => void;
  testID?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const committed = useRef(false);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Focus once the tap that opened this field has finished and the row's
  // entering animation has made it visible; `autoFocus` can lose that race
  // and leave the keyboard down.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), FOCUS_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const commit = (via: CommitReason) => {
    if (committed.current) {
      return;
    }
    committed.current = true;
    onCommit(value, via);
  };

  return (
    <TextInput
      ref={inputRef}
      testID={testID}
      value={value}
      onChangeText={setValue}
      onSubmitEditing={() => commit('submit')}
      onBlur={() => commit('blur')}
      submitBehavior="submit"
      returnKeyType="done"
      placeholder={placeholder}
      placeholderTextColor={colors.textGhost}
      selectionColor={colors.saffron}
      cursorColor={colors.saffron}
      style={[typography.body, styles.field, styles.editing]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  field: {
    flex: 1,
    minHeight: layout.fieldHeight,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: radii.field,
    borderWidth: 1,
  },
  saved: {
    borderColor: colors.border,
  },
  add: {
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  editing: {
    borderColor: colors.saffron,
    boxShadow: `0px 0px 4px ${colors.saffronGlow}`,
    textAlign: 'center',
    paddingVertical: 0,
  },
  centered: {
    textAlign: 'center',
  },
  addLabel: {
    color: colors.textGhost,
  },
});
