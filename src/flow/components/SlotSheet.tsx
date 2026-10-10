import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RulerPicker } from '../../components/RulerPicker';
import type { Slot } from '../../core/model';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import { colors, spacing } from '../../theme';
import type { ClockTime } from '../../types/models';
import { haptics } from '../../utils/haptics';
import { SheetTitle } from './SheetTitle';

/** Times move in quarter hours. */
const STEP = 15;
const SHORTEST = 30;
const LONGEST = 4 * 60;
const EARLIEST = 4 * 60;
const LATEST = 23 * 60;

/**
 * One deep-work slot on two rulers, From and To. "To" stays between half
 * an hour and four hours after "From", and moving "From" carries it along.
 * A slot can't overlap another one. Nothing changes until Done.
 */
export function SlotSheet({
  visible,
  title,
  slot,
  others,
  onDone,
  onRemove,
  onClose,
}: {
  visible: boolean;
  title: string;
  slot: Slot;
  /** The day's other slots, to keep this one clear of them. */
  others: Slot[];
  onDone: (slot: Slot) => void;
  /** Shown when the day can spare this slot. */
  onRemove?: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const [from, setFrom] = useState<ClockTime>(slot.start);
  // Kept as a length, so moving "From" carries "To" along with it.
  const [length, setLength] = useState(slot.minutes);
  useEffect(() => {
    if (visible) {
      setFrom(slot.start);
      setLength(slot.minutes);
    }
  }, [visible, slot.start, slot.minutes]);
  const to = from + length;
  const clash = others.some(o => from < o.start + o.minutes && o.start < to);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={title}
      testID="slot-sheet"
    >
      <SheetTitle title={title} subtitle={t.rhythm.slotSub} />
      <View style={styles.block}>
        <AppText variant="eyebrow">{t.rhythm.from}</AppText>
        <RulerPicker
          testID="slot-from"
          accessibilityLabel={t.rhythm.from}
          value={Math.round(from / STEP)}
          min={EARLIEST / STEP}
          max={LATEST / STEP}
          onChange={v => setFrom(v * STEP)}
          formatLabel={v => clock(t, v * STEP)}
        />
      </View>
      <View style={styles.block}>
        <AppText variant="eyebrow">{t.rhythm.to}</AppText>
        <RulerPicker
          key={from}
          testID="slot-to"
          accessibilityLabel={t.rhythm.to}
          value={Math.round(to / STEP)}
          min={(from + SHORTEST) / STEP}
          max={(from + LONGEST) / STEP}
          onChange={v => setLength(v * STEP - from)}
          formatLabel={v => clock(t, v * STEP)}
        />
      </View>
      <AppText style={[styles.summary, clash && styles.clash]}>
        {clash
          ? t.rhythm.overlap
          : `${t.rhythm.window(
              clock(t, from),
              clock(t, to),
            )} · ${t.common.minutes(length)}`}
      </AppText>
      <View style={styles.actions}>
        <PrimaryButton
          testID="slot-done"
          label={t.common.done}
          shadow="none"
          disabled={clash}
          onPress={() => onDone({ start: from, minutes: length })}
        />
        {onRemove ? (
          <Pressable
            testID="slot-remove"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              haptics.selection();
              onRemove();
            }}
            style={styles.remove}
          >
            <AppText variant="label" style={styles.removeText}>
              {t.rhythm.removeSlot}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.xl,
    gap: spacing.label,
    paddingHorizontal: 13,
  },
  summary: {
    marginTop: spacing.xl,
    textAlign: 'center',
    color: colors.textMuted,
  },
  clash: {
    color: colors.danger,
  },
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  remove: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  removeText: {
    color: colors.danger,
  },
});
