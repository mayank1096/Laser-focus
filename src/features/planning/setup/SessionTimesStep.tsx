import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { useSurface } from '../../../components/Surface';
import type { SessionSlot } from '../../../types/models';
import { colors, fonts, layout, motion, radii, spacing } from '../../../theme';
import { formatClock, partOfDay } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import { SlotSheet } from '../components/SlotSheet';
import { findClash, PLANNING_LIMITS, usePlanning } from '../store';

const ORDINAL = ['first', 'second', 'third'];

export function SessionTimesStep() {
  const slots = usePlanning(s => s.slots);
  const addSlot = usePlanning(s => s.addSlot);
  const [editing, setEditing] = useState<SessionSlot | null>(null);
  const clash = findClash(slots);
  const atMax = slots.length >= PLANNING_LIMITS.slots.max;

  return (
    <>
      <QuestionHeader
        eyebrow="Session times"
        title="When do you go deep?"
        subtitle="Up to three sessions a day. Same times, every day."
      />
      <QuestionBody>
        <View style={styles.list}>
          {slots.map(slot => (
            <SlotRow
              key={slot.id}
              slot={slot}
              onPress={() => setEditing(slot)}
            />
          ))}
          {!atMax ? (
            <Animated.View
              layout={LinearTransition.duration(motion.base)}
              entering={FadeIn.duration(motion.base)}
              exiting={FadeOut.duration(motion.fast)}
            >
              <AddRow
                testID="slot-add"
                label={`+  Add a ${ORDINAL[slots.length]} session`}
                onPress={() => {
                  if (addSlot()) {
                    // Open the new one straight away to set its time.
                    setEditing(usePlanning.getState().slots.at(-1) ?? null);
                  }
                }}
              />
            </Animated.View>
          ) : null}
        </View>
        <Animated.View layout={LinearTransition.duration(motion.base)}>
          {clash ? (
            <AppText variant="caption" style={[styles.note, styles.warn]}>
              {`${formatClock(
                clash.later.start,
              )} starts before the ${formatClock(
                clash.earlier.start,
              )} session ends.`}
            </AppText>
          ) : (
            <AppText variant="caption" style={styles.note}>
              {atMax
                ? 'Three is the most. Guard them.'
                : 'Most people start with two. Three is the most.'}
            </AppText>
          )}
        </Animated.View>
      </QuestionBody>
      <SlotSheet slot={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function SlotRow({
  slot,
  onPress,
}: {
  slot: SessionSlot;
  onPress: () => void;
}) {
  const surface = useSurface();
  return (
    <Animated.View
      layout={LinearTransition.duration(motion.base)}
      entering={FadeInDown.duration(motion.base).easing(motion.easeOut)}
      exiting={FadeOut.duration(motion.fast)}
    >
      <Pressable
        testID={`slot-${slot.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${partOfDay(slot.start)} session at ${formatClock(
          slot.start,
        )}, ${slot.minutes} minutes`}
        accessibilityHint="Change the time or length"
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        style={({ pressed }) => [
          styles.slot,
          { backgroundColor: surface },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.time}>
          <AppText variant="eyebrow">{partOfDay(slot.start)}</AppText>
          <AppText variant="heading" style={styles.clock}>
            {formatClock(slot.start)}
          </AppText>
        </View>
        <View style={styles.length}>
          <AppText variant="label">{`${slot.minutes} min`}</AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** The dashed "add" row, matching the list fields. */
export function AddRow({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const surface = useSurface();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.add,
        { backgroundColor: surface },
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="body" style={styles.addLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clock: {
    fontFamily: fonts.sansMedium,
  },
  list: {
    gap: 10,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingLeft: spacing.xl,
    paddingRight: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pressed: {
    borderColor: colors.saffron,
  },
  time: {
    gap: spacing.xxs,
  },
  length: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  add: {
    minHeight: layout.fieldHeight + 4,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.field,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  addLabel: {
    color: colors.textGhost,
  },
  note: {
    marginTop: spacing.lg,
  },
  warn: {
    color: colors.ember,
  },
});
