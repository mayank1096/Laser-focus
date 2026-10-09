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
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import { colors, fonts, motion, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { ClockSheet } from './ClockSheet';

const LENGTHS = [60, 90, 120, 180];
/** Common deep-work starts: early, morning, evening, night. */
const FOCUS_TIMES = [300, 360, 420, 480, 1080, 1200, 1320];
const REMINDER_TIMES = [1200, 1260, 1320];

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
 * Focus time, review day and the one evening reminder: every choice is a
 * tap on the screen itself, no dropdowns. Odd times live behind "Other".
 */
export function RhythmEditor() {
  const t = useT();
  const rhythm = useBook(s => s.rhythm);
  const setRhythm = useBook(s => s.setRhythm);
  const [picking, setPicking] = useState<'focus' | 'reminder' | null>(null);

  // A custom time shows up as its own pill, first in the row.
  const focusTimes = FOCUS_TIMES.includes(rhythm.focusStart)
    ? FOCUS_TIMES
    : [rhythm.focusStart, ...FOCUS_TIMES];
  const reminderTimes = REMINDER_TIMES.includes(rhythm.reminderAt)
    ? REMINDER_TIMES
    : [rhythm.reminderAt, ...REMINDER_TIMES];

  // Review day repeats every week, so it's a weekday, not a date.
  const week = [1, 2, 3, 4, 5, 6, 0];

  return (
    <View style={styles.wrap}>
      {/* Focus time */}
      <View style={styles.section}>
        <SectionHeader
          Icon={Clock}
          title={t.rhythm.focus}
          value={t.rhythm.window(
            clock(t, rhythm.focusStart),
            clock(t, rhythm.focusStart + rhythm.focusMinutes),
          )}
        />
        <PillRow>
          {focusTimes.map(at => (
            <Pill
              key={at}
              testID={`focus-at-${at}`}
              Icon={skyIcon(at)}
              label={clock(t, at)}
              selected={rhythm.focusStart === at}
              onPress={() => setRhythm({ focusStart: at })}
            />
          ))}
          <Pill
            Icon={Clock}
            role="button"
            testID="rhythm-focus"
            label={t.rhythm.other}
            selected={false}
            onPress={() => setPicking('focus')}
          />
        </PillRow>
        <SegmentedControl
          segments={LENGTHS.map(m => ({
            id: m,
            label: t.common.minutes(m),
            testID: `rhythm-length-${m}`,
          }))}
          value={rhythm.focusMinutes}
          onChange={m => setRhythm({ focusMinutes: m })}
        />
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

      <ClockSheet
        testID="rhythm-clock"
        visible={picking !== null}
        title={picking === 'focus' ? t.rhythm.pickTime : t.rhythm.pickReminder}
        value={picking === 'focus' ? rhythm.focusStart : rhythm.reminderAt}
        onClose={() => setPicking(null)}
        onDone={at => {
          setRhythm(
            picking === 'focus' ? { focusStart: at } : { reminderAt: at },
          );
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
