import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Chip, ChipRow } from '../../../components/Chip';
import { TextField } from '../../../components/TextField';
import { partOfDay } from '../../../utils/date';
import type { SessionSlot } from '../../../types/models';
import { colors, spacing } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { PLANNING_LIMITS, SLOT_LENGTHS, usePlanning } from '../store';
import { ClockSheet } from './ClockSheet';

/** Edit one daily session: its name, when it starts and how long it runs. */
export function SlotSheet({
  slot,
  onClose,
}: {
  slot: SessionSlot | null;
  onClose: () => void;
}) {
  const updateSlot = usePlanning(s => s.updateSlot);
  const removeSlot = usePlanning(s => s.removeSlot);
  const canRemove = usePlanning(
    s => s.slots.length > PLANNING_LIMITS.slots.min,
  );
  const [minutes, setMinutes] = useState(slot?.minutes ?? 90);
  const [name, setName] = useState(slot?.name ?? '');
  useEffect(() => {
    if (slot) {
      setMinutes(slot.minutes);
      setName(slot.name ?? '');
    }
  }, [slot]);

  return (
    <ClockSheet
      testID="slot-sheet"
      visible={slot !== null}
      title="Session"
      subtitle="Name it, and set the same time every day."
      value={slot?.start ?? 6 * 60}
      onClose={onClose}
      onDone={start => {
        if (slot) {
          updateSlot(slot.id, { start, minutes, name: name.trim() });
        }
        onClose();
      }}
      footer={
        canRemove && slot ? (
          <Pressable
            testID="slot-remove"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.remove}
            onPress={() => {
              haptics.warning();
              removeSlot(slot.id);
              onClose();
            }}
          >
            <AppText variant="label" style={styles.removeText}>
              Remove this session
            </AppText>
          </Pressable>
        ) : null
      }
    >
      <View style={styles.group}>
        <AppText variant="eyebrow">Name</AppText>
        <TextField
          testID="slot-name"
          accessibilityLabel="Session name"
          value={name}
          onChangeText={setName}
          placeholder={slot ? partOfDay(slot.start) : 'Morning'}
          maxLength={28}
        />
      </View>
      <View style={styles.group}>
        <AppText variant="eyebrow">Length</AppText>
        <ChipRow>
          {SLOT_LENGTHS.map(m => (
            <Chip
              key={m}
              testID={`slot-length-${m}`}
              role="radio"
              label={`${m} min`}
              selected={minutes === m}
              onPress={() => setMinutes(m)}
            />
          ))}
        </ChipRow>
      </View>
    </ClockSheet>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.md,
  },
  remove: {
    alignSelf: 'center',
  },
  removeText: {
    color: colors.danger,
  },
});
