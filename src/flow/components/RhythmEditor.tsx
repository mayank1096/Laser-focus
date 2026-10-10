import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import Bell from '../../assets/icons/bell.svg';
import CalendarCheck from '../../assets/icons/calendar-check.svg';
import Clock from '../../assets/icons/clock.svg';
import Moon from '../../assets/icons/moon.svg';
import Sun from '../../assets/icons/sun.svg';
import Sunrise from '../../assets/icons/sunrise.svg';
import Sunset from '../../assets/icons/sunset.svg';
import { AppText } from '../../components/AppText';
import { Pill, PillRow, SectionHeader } from '../../components/Pill';
import { SegmentedControl, TRACK } from '../../components/SegmentedControl';
import type { ClockTime } from '../../types/models';
import { SLOTS, totalSlotMinutes, type Slot } from '../../core/model';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import { colors, fonts, motion, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { ClockSheet } from './ClockSheet';
import { SlotSheet } from './SlotSheet';

const REMINDER_TIMES = [1200, 1260, 1320];
const COUNTS = [1, 2, 3, 4, 5];

/** The sky at that hour: sunrise, sun, sunset or moon. */
function skyIcon(at: ClockTime): React.FC<SvgProps> {
  const h = at / 60;
  if (h >= 4 && h < 8) {
    return Sunrise;
  }
  if (h >= 8 && h < 17) {
    return Sun;
  }
  if (h >= 17 && h < 20) {
    return Sunset;
  }
  return Moon;
}

/**
 * Deep work slots, review day and the one evening reminder: every choice is a
 * tap on the screen itself, no dropdowns. Odd times live behind "Other".
 */
export function RhythmEditor() {
  const t = useT();
  const rhythm = useBook(s => s.rhythm);
  const setRhythm = useBook(s => s.setRhythm);
  const [picking, setPicking] = useState<'reminder' | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const total = totalSlotMinutes(rhythm);
  // Slots always read in order through the day.
  const setSlots = (slots: Slot[]) =>
    setRhythm({ slots: [...slots].sort((x, y) => x.start - y.start) });
  const edited = editing !== null ? rhythm.slots[editing] : undefined;
  // More slots: each new one an hour after the last. Fewer: the latest go.
  const setCount = (n: number) => {
    haptics.selection();
    const next = rhythm.slots.slice(0, n);
    while (next.length < n) {
      const last = next[next.length - 1];
      const start = Math.min(
        22 * 60,
        last ? last.start + last.minutes + 60 : 6 * 60,
      );
      next.push({ start, minutes: 60 });
    }
    setSlots(next);
  };

  // A custom time shows up as its own pill, first in the row.
  const reminderTimes = REMINDER_TIMES.includes(rhythm.reminderAt)
    ? REMINDER_TIMES
    : [rhythm.reminderAt, ...REMINDER_TIMES];

  // Review day repeats every week, so it's a weekday, not a date.
  const week = [1, 2, 3, 4, 5, 6, 0];

  return (
    <View style={styles.wrap}>
      {/* Deep work slots */}
      <View style={styles.section}>
        <SectionHeader Icon={Clock} title={t.rhythm.slots} />
        <View style={styles.count}>
          <AppText variant="detail">{t.rhythm.howMany}</AppText>
          <SegmentedControl<number>
            testIDPrefix="slot-count"
            value={rhythm.slots.length}
            segments={COUNTS.map(n => ({ id: n, label: String(n) }))}
            onChange={setCount}
          />
        </View>
        <View style={styles.slots}>
          {rhythm.slots.map((slot, i) => {
            const Icon = skyIcon(slot.start);
            return (
              <Pressable
                key={i}
                testID={`slot-${i}`}
                accessibilityRole="button"
                accessibilityLabel={t.rhythm.slot(i + 1)}
                onPress={() => {
                  haptics.tap();
                  setEditing(i);
                }}
                style={({ pressed }) => [
                  styles.slot,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.slotIcon}>
                  <Icon
                    width={18}
                    height={18}
                    color={colors.saffron}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={styles.flex}>
                  <AppText variant="detail">{t.rhythm.slot(i + 1)}</AppText>
                  <AppText style={styles.slotValue}>
                    {t.rhythm.window(
                      clock(t, slot.start),
                      clock(t, slot.start + slot.minutes),
                    )}
                  </AppText>
                </View>
                <AppText variant="label" style={styles.slotLength}>
                  {t.common.minutes(slot.minutes)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText
          variant="detail"
          style={
            total < SLOTS.minTotal || total > SLOTS.maxTotal
              ? styles.warn
              : null
          }
        >
          {total < SLOTS.minTotal
            ? t.rhythm.tooLittle(t.common.minutes(total))
            : total > SLOTS.maxTotal
            ? t.rhythm.tooMuch(t.common.minutes(total))
            : t.rhythm.total(t.common.minutes(total))}
        </AppText>
      </View>

      {/* Weekly review */}
      <View style={styles.section}>
        <SectionHeader Icon={CalendarCheck} title={t.rhythm.reviewShort} />
        <View style={styles.days}>
          {week.map(day => {
            const on = rhythm.reviewDay === day;
            return (
              <Pressable
                key={day}
                testID={`review-day-${day}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.common.days[day]}
                onPress={() => {
                  if (!on) {
                    haptics.selection();
                    setRhythm({ reviewDay: day });
                  }
                }}
                style={[styles.day, on && styles.picked]}
              >
                <AppText style={[styles.dayName, on && styles.pickedText]}>
                  {t.common.dayShort[day]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="detail">
          {t.rhythm.reviewWhy(t.common.days[rhythm.reviewDay])}
        </AppText>
      </View>

      {/* Evening reminder */}
      <View style={styles.section}>
        <View style={styles.reminder}>
          <View style={styles.bell}>
            <Bell width={18} height={18} color={colors.ink} />
          </View>
          <View style={styles.reminderText}>
            <AppText variant="bodyMedium">{t.rhythm.reminder}</AppText>
            <AppText variant="detail">{t.rhythm.reminderSub}</AppText>
          </View>
          <Switch
            testID="rhythm-reminder"
            value={rhythm.reminderOn}
            onValueChange={on => {
              haptics.selection();
              setRhythm({ reminderOn: on });
            }}
            trackColor={{ true: colors.saffron, false: colors.hairline }}
            thumbColor={colors.white}
          />
        </View>
        {rhythm.reminderOn ? (
          <Animated.View entering={FadeIn.duration(motion.base)}>
            <PillRow>
              {reminderTimes.map(at => (
                <Pill
                  key={at}
                  testID={`reminder-at-${at}`}
                  Icon={skyIcon(at)}
                  label={clock(t, at)}
                  selected={rhythm.reminderAt === at}
                  onPress={() => setRhythm({ reminderAt: at })}
                />
              ))}
              <Pill
                Icon={Clock}
                role="button"
                testID="rhythm-reminder-time"
                label={t.rhythm.other}
                selected={false}
                onPress={() => setPicking('reminder')}
              />
            </PillRow>
          </Animated.View>
        ) : null}
      </View>

      {edited && editing !== null ? (
        <SlotSheet
          visible
          title={t.rhythm.slot(editing + 1)}
          slot={edited}
          others={rhythm.slots.filter((_, i) => i !== editing)}
          onClose={() => setEditing(null)}
          onDone={slot => {
            haptics.success();
            setSlots(rhythm.slots.map((x, i) => (i === editing ? slot : x)));
            setEditing(null);
          }}
        />
      ) : null}
      <ClockSheet
        testID="rhythm-clock"
        visible={picking !== null}
        title={t.rhythm.pickReminder}
        value={rhythm.reminderAt}
        onClose={() => setPicking(null)}
        onDone={at => {
          setRhythm({ reminderAt: at });
          setPicking(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 40,
  },
  count: {
    gap: spacing.label,
  },
  slots: {
    gap: 10,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.saffron,
    backgroundColor: colors.saffronWash,
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  slotValue: {
    marginTop: 2,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink,
  },
  slotLength: {
    color: colors.saffron,
  },
  warn: {
    color: colors.danger,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
  section: {
    gap: spacing.xl,
  },
  // Chosen, not pressable-looking: a saffron tint and outline. Only the
  // screen's main button is dark.
  picked: {
    backgroundColor: colors.saffronWash,
    borderColor: colors.saffron,
  },
  pickedText: {
    color: colors.ink,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: TRACK,
  },
  dayName: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TRACK,
  },
  reminderText: {
    flex: 1,
    gap: 4,
  },
});
