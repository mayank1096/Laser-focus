import React, { useEffect, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import Bell from '../../assets/icons/bell.svg';
import CalendarCheck from '../../assets/icons/calendar-check.svg';
import Clock from '../../assets/icons/clock.svg';
import Moon from '../../assets/icons/moon.svg';
import Sun from '../../assets/icons/sun.svg';
import Sunrise from '../../assets/icons/sunrise.svg';
import Sunset from '../../assets/icons/sunset.svg';
import { AppText } from '../../components/AppText';
import { appDay } from '../../core/days';
import type { ClockTime } from '../../types/models';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import { colors, fonts, motion, spacing, springs } from '../../theme';
import { addDays, fromISODate } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { ClockSheet } from './ClockSheet';

const LENGTHS = [60, 90, 120, 180];
/** Common deep-work starts: early, morning, evening, night. */
const FOCUS_TIMES = [300, 360, 420, 480, 1080, 1200, 1320];
const REMINDER_TIMES = [1200, 1260, 1320];

const TRACK = 'rgba(0, 0, 0, 0.045)';

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
  const today = appDay();

  // A custom time shows up as its own pill, first in the row.
  const focusTimes = FOCUS_TIMES.includes(rhythm.focusStart)
    ? FOCUS_TIMES
    : [rhythm.focusStart, ...FOCUS_TIMES];
  const reminderTimes = REMINDER_TIMES.includes(rhythm.reminderAt)
    ? REMINDER_TIMES
    : [rhythm.reminderAt, ...REMINDER_TIMES];

  // The coming seven days, today first, so the dates read in order.
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = fromISODate(addDays(today, i));
    return { day: date.getDay(), date: date.getDate() };
  });

  return (
    <View style={styles.wrap}>
      {/* Focus time */}
      <View style={styles.section}>
        <Header
          Icon={Clock}
          title={t.rhythm.focus}
          value={t.rhythm.window(
            clock(t, rhythm.focusStart),
            clock(t, rhythm.focusStart + rhythm.focusMinutes),
          )}
        />
        <PillRow>
          {focusTimes.map(at => (
            <TimePill
              key={at}
              testID={`focus-at-${at}`}
              at={at}
              label={clock(t, at)}
              selected={rhythm.focusStart === at}
              onPress={() => setRhythm({ focusStart: at })}
            />
          ))}
          <TimePill
            testID="rhythm-focus"
            label={t.rhythm.other}
            selected={false}
            onPress={() => setPicking('focus')}
          />
        </PillRow>
        <Segmented
          options={LENGTHS.map(m => ({
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
        <Header Icon={CalendarCheck} title={t.rhythm.reviewShort} />
        <View style={styles.days}>
          {week.map(({ day, date }) => {
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
                style={[styles.day, on && styles.dark]}
              >
                <AppText
                  variant="micro"
                  style={[styles.dayName, on && styles.onDarkSoft]}
                >
                  {t.common.dayShort[day]}
                </AppText>
                <AppText style={[styles.dayDate, on && styles.onDark]}>
                  {String(date)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText variant="label" style={styles.note}>
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
            <AppText variant="label" style={styles.muted}>
              {t.rhythm.reminderSub}
            </AppText>
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
                <TimePill
                  key={at}
                  testID={`reminder-at-${at}`}
                  at={at}
                  label={clock(t, at)}
                  selected={rhythm.reminderAt === at}
                  onPress={() => setRhythm({ reminderAt: at })}
                />
              ))}
              <TimePill
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

function Header({
  Icon,
  title,
  value,
}: {
  Icon: React.FC<SvgProps>;
  title: string;
  value?: string;
}) {
  return (
    <View style={styles.header}>
      <Icon width={20} height={20} color={colors.ink} />
      <AppText variant="bodyBold" style={styles.headerTitle}>
        {title}
      </AppText>
      {value ? (
        <AppText variant="label" style={styles.headerValue}>
          {value}
        </AppText>
      ) : null}
    </View>
  );
}

/** A row of pills that scrolls sideways when it runs out of room. */
function PillRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.pills}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

function TimePill({
  at,
  label,
  selected,
  onPress,
  testID,
}: {
  at?: ClockTime;
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const Icon = at === undefined ? Clock : skyIcon(at);
  return (
    <Pressable
      testID={testID}
      accessibilityRole={at === undefined ? 'button' : 'radio'}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.dark,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Icon
        width={18}
        height={18}
        color={selected ? colors.white : colors.ink}
      />
      <AppText style={[styles.pillText, selected && styles.onDark]}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** A soft track with a dark thumb that slides to the chosen option. */
function Segmented<T extends number>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string; testID?: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex(o => o.id === value),
  );
  const segment = width ? (width - 8) / options.length : 0;
  const x = useSharedValue(index * segment);
  useEffect(() => {
    x.value = withSpring(index * segment, springs.snappy);
  }, [index, segment, x]);
  const thumb = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={styles.track}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="radiogroup"
    >
      {segment ? <Animated.View style={[styles.thumb, thumb]} /> : null}
      {options.map(o => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            testID={o.testID}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (!on) {
                haptics.selection();
                onChange(o.id);
              }
            }}
            style={styles.segment}
          >
            <AppText style={[styles.segmentText, on && styles.onDark]}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
  },
  headerValue: {
    color: colors.saffron,
  },
  // Pills run to the screen's edge, so a cut-off one says "scroll".
  bleed: {
    marginRight: -spacing.gutter,
  },
  pills: {
    gap: 10,
    paddingRight: spacing.gutter,
  },
  pill: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 26,
    backgroundColor: TRACK,
  },
  pillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  pressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    backgroundColor: colors.charcoal,
  },
  onDark: {
    color: colors.white,
  },
  onDarkSoft: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  track: {
    flexDirection: 'row',
    height: 56,
    padding: 4,
    borderRadius: 28,
    backgroundColor: TRACK,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 24,
    backgroundColor: colors.charcoal,
    boxShadow: '0px 6px 14px rgba(0, 0, 0, 0.18)',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: TRACK,
  },
  dayName: {
    color: colors.textMuted,
  },
  dayDate: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.ink,
  },
  note: {
    color: colors.textMuted,
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
  muted: {
    color: colors.textMuted,
  },
});
