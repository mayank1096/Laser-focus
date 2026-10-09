import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { SelectField } from '../../components/SelectField';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import { colors, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { ClockSheet } from './ClockSheet';

const LENGTHS = [60, 90, 120, 180];
/** Monday first; values match `Date.getDay()`. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Focus time, review day and the one evening reminder. */
export function RhythmEditor() {
  const t = useT();
  const rhythm = useBook(s => s.rhythm);
  const setRhythm = useBook(s => s.setRhythm);
  const [picking, setPicking] = useState<'focus' | 'reminder' | null>(null);

  return (
    <View style={styles.wrap}>
      <View style={styles.group}>
        <AppText variant="eyebrow">{t.rhythm.focus}</AppText>
        <SelectField
          testID="rhythm-focus"
          accessibilityLabel={t.rhythm.focus}
          value={`${clock(t, rhythm.focusStart)} · ${t.rhythm.everyDay}`}
          onPress={() => setPicking('focus')}
        />
        <ChipRow>
          {LENGTHS.map(m => (
            <Chip
              key={m}
              testID={`rhythm-length-${m}`}
              role="radio"
              label={t.common.minutes(m)}
              selected={rhythm.focusMinutes === m}
              onPress={() => setRhythm({ focusMinutes: m })}
            />
          ))}
        </ChipRow>
      </View>

      <View style={styles.group}>
        <AppText variant="eyebrow">{t.rhythm.review}</AppText>
        <ChipRow wrap={false} spread>
          {WEEK.map(day => (
            <Chip
              key={day}
              testID={`review-day-${day}`}
              role="radio"
              square={40}
              label={t.common.dayLetter[day]}
              accessibilityLabel={t.common.days[day]}
              selected={rhythm.reviewDay === day}
              onPress={() => setRhythm({ reviewDay: day })}
            />
          ))}
        </ChipRow>
        <AppText variant="caption">
          {t.rhythm.reviewWhy(t.common.days[rhythm.reviewDay])}
        </AppText>
      </View>

      <View style={styles.group}>
        <View style={styles.row}>
          <AppText variant="bodyMedium" style={styles.flex}>
            {t.rhythm.reminder}
          </AppText>
          <Switch
            testID="rhythm-reminder"
            value={rhythm.reminderOn}
            onValueChange={on => {
              haptics.selection();
              setRhythm({ reminderOn: on });
            }}
            trackColor={{ true: colors.saffron, false: colors.hairline }}
          />
        </View>
        {rhythm.reminderOn ? (
          <SelectField
            testID="rhythm-reminder-time"
            accessibilityLabel={t.rhythm.reminderAt}
            value={clock(t, rhythm.reminderAt)}
            onPress={() => setPicking('reminder')}
          />
        ) : null}
        <AppText variant="caption">{t.rhythm.onlyOne}</AppText>
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
    gap: 28,
  },
  group: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex: {
    flex: 1,
  },
});
