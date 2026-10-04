import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import ArrowDown from '../assets/icons/arrow-down.svg';
import ArrowUp from '../assets/icons/arrow-up.svg';
import Remove from '../assets/icons/x.svg';
import type { SheetLine } from '../types/models';
import { colors, layout, motion, radii, spacing, typography } from '../theme';
import { createId } from '../utils/id';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { useSurface } from './Surface';

const NEW = '__new__';
const FOCUS_DELAY = 60;
const BLUR_GRACE = 150;

export interface ListFieldProps {
  items: SheetLine[];
  onChange: (items: SheetLine[]) => void;
  max: number;
  /** Lines needed before the step can continue; shows "n more to go". */
  min?: number;
  /** Text on the dashed "add" row, e.g. "Add a new Value". */
  addLabel: string;
  /** Placeholder while typing a new line. */
  placeholder?: string;
  /** Optional element shown to the right of each saved row (e.g. a month). */
  renderTrailing?: (item: SheetLine, index: number) => ReactNode;
  idPrefix?: string;
  /**
   * `field`: outlined rows, as in the setup questions.
   * `card`: soft cards with serif lines, as on the Action Book sheets.
   */
  appearance?: 'field' | 'card';
  /** Card colour for the `card` appearance. */
  cardColor?: string;
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
 * - Tap a saved line to edit it. While editing, it can be moved up or down
 *   or removed; clearing the text removes it too.
 * - The add row disappears once `max` lines exist.
 */
export function ListField({
  items,
  onChange,
  max,
  min = 0,
  addLabel,
  placeholder,
  renderTrailing,
  idPrefix = 'line',
  appearance = 'field',
  cardColor = colors.white,
  testID,
}: ListFieldProps) {
  const card = appearance === 'card';
  const surface = useSurface();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Bumped to give a fresh input when typing several new lines in a row.
  const [newSession, setNewSession] = useState(0);
  // Commits can arrive from a blur after the parent re-rendered; always work
  // from the latest list.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const editorRef = useRef<LineInputHandle>(null);

  const emit = (next: SheetLine[]) => {
    itemsRef.current = next;
    onChange(next);
  };

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
    } else if (current.find(item => item.id === id)?.text !== text) {
      next = current.map(item => (item.id === id ? { ...item, text } : item));
    }

    if (next !== current) {
      emit(next);
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

  /** Saves the open line's text, then moves or removes it. */
  const act = (id: string, action: 'up' | 'down' | 'remove') => {
    const text = editorRef.current?.take() ?? '';
    const saved = commitLine(id, text);
    const index = saved.findIndex(item => item.id === id);
    if (index !== -1) {
      if (action === 'remove') {
        emit(saved.filter(item => item.id !== id));
      } else {
        const to = action === 'up' ? index - 1 : index + 1;
        if (to >= 0 && to < saved.length) {
          const next = [...saved];
          [next[index], next[to]] = [next[to], next[index]];
          emit(next);
        }
      }
    }
    setEditingId(null);
    Keyboard.dismiss();
  };

  const canAdd = items.length < max && editingId !== NEW;
  const remaining = Math.max(0, min - items.length);

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
            <>
              <LineInput
                ref={editorRef}
                initialValue={item.text}
                placeholder={placeholder}
                surface={surface}
                onCommit={(text, via) => handleCommit(item.id, text, via)}
              />
              <View style={styles.actions}>
                {items.length > 1 && (
                  <>
                    <IconButton
                      Icon={ArrowUp}
                      filled
                      accessibilityLabel="Move up"
                      disabled={index === 0}
                      onPress={() => act(item.id, 'up')}
                    />
                    <IconButton
                      Icon={ArrowDown}
                      filled
                      accessibilityLabel="Move down"
                      disabled={index === items.length - 1}
                      onPress={() => act(item.id, 'down')}
                    />
                  </>
                )}
                <IconButton
                  Icon={Remove}
                  filled
                  accessibilityLabel="Remove line"
                  testID={testID ? `${testID}-remove` : undefined}
                  onPress={() => act(item.id, 'remove')}
                />
              </View>
            </>
          ) : (
            <>
              <Pressable
                style={[
                  styles.field,
                  card ? styles.card : styles.saved,
                  { backgroundColor: card ? cardColor : surface },
                ]}
                onPress={() => setEditingId(item.id)}
                accessibilityRole="button"
                accessibilityHint="Edit, move or remove this line"
              >
                <AppText
                  variant={card ? 'cardTitle' : 'body'}
                  style={[styles.centered, card && styles.cardText]}
                >
                  {item.text}
                </AppText>
              </Pressable>
              {renderTrailing?.(item, index)}
            </>
          )}
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
            surface={surface}
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
            style={[styles.field, styles.add, { backgroundColor: surface }]}
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

      {remaining > 0 && (
        <Animated.View
          layout={layoutTransition}
          entering={FadeIn.duration(motion.base)}
          exiting={FadeOut.duration(motion.fast)}
        >
          <AppText variant="caption" style={[styles.centered, styles.helper]}>
            {`${remaining} more to go`}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

type CommitReason = 'submit' | 'blur';

interface LineInputHandle {
  /** Returns the current text and stops this input from committing itself. */
  take: () => string;
}

/**
 * Owns its own text so a late blur can never save another line's draft.
 * Reports exactly once per editing session.
 */
const LineInput = forwardRef<
  LineInputHandle,
  {
    initialValue: string;
    placeholder?: string;
    surface: string;
    onCommit: (text: string, via: CommitReason) => void;
    testID?: string;
  }
>(function LineInputField(
  { initialValue, placeholder, surface, onCommit, testID },
  ref,
) {
  const [value, setValue] = useState(initialValue);
  const committed = useRef(false);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useImperativeHandle(ref, () => ({
    take: () => {
      committed.current = true;
      return value;
    },
  }));

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
      // A short grace period lets a tap on Move/Remove claim the text first.
      onBlur={() => setTimeout(() => commit('blur'), BLUR_GRACE)}
      submitBehavior="submit"
      returnKeyType="done"
      maxLength={90}
      placeholder={placeholder}
      placeholderTextColor={colors.textGhost}
      selectionColor={colors.saffron}
      cursorColor={colors.saffron}
      style={[
        typography.body,
        styles.field,
        styles.editing,
        { backgroundColor: surface },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  card: {
    borderColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    boxShadow: '0px 6px 18px rgba(0, 0, 0, 0.04)',
  },
  cardText: {
    fontSize: 15,
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
  helper: {
    marginTop: spacing.xs,
  },
});
