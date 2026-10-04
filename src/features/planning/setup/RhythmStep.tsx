import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Chip, ChipRow } from '../../../components/Chip';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { SelectField } from '../../../components/SelectField';
import { DAY_NAMES, formatClock } from '../../../utils/date';
import { ClockSheet } from '../components/ClockSheet';
import { usePlanning } from '../store';

/** Monday first, as the week runs; values match `Date.getDay()`. */
const WEEK = [1, 2, 3, 4, 5, 6, 0];

type Picking = 'weekly' | 'nightly' | null;

export function RhythmStep() {
  const rhythm = usePlanning(s => s.rhythm);
  const setRhythm = usePlanning(s => s.setRhythm);
  const [picking, setPicking] = useState<Picking>(null);

  return (
    <>
      <QuestionHeader
        eyebrow="Planning rhythm"
        title="When will you plan?"
        subtitle="Plan the week once. Seal each day the night before."
      />
      <QuestionBody>
        <View style={styles.group}>
          <AppText variant="eyebrow">Weekly plan · 10 min</AppText>
          <ChipRow wrap={false} spread>
            {WEEK.map(day => (
              <Chip
                key={day}
                testID={`rhythm-day-${day}`}
                role="radio"
                square={40}
                label={DAY_NAMES[day][0]}
                accessibilityLabel={DAY_NAMES[day]}
                selected={rhythm.weeklyDay === day}
                onPress={() => setRhythm({ weeklyDay: day })}
              />
            ))}
          </ChipRow>
          <SelectField
            testID="rhythm-weekly-time"
            accessibilityLabel="Weekly planning time"
            value={`${DAY_NAMES[rhythm.weeklyDay]} at ${formatClock(
              rhythm.weeklyAt,
            )}`}
            onPress={() => setPicking('weekly')}
          />
        </View>
        <View style={[styles.group, styles.second]}>
          <AppText variant="eyebrow">Nightly sheet · 3 min</AppText>
          <SelectField
            testID="rhythm-nightly-time"
            accessibilityLabel="Nightly planning time"
            value={`Every night at ${formatClock(rhythm.nightlyAt)}`}
            onPress={() => setPicking('nightly')}
          />
          <AppText variant="caption">
            If tomorrow isn’t sealed by then, we’ll remind you once.
          </AppText>
        </View>
      </QuestionBody>
      <ClockSheet
        testID="rhythm-sheet"
        visible={picking !== null}
        title={picking === 'weekly' ? 'Weekly plan' : 'Nightly sheet'}
        value={picking === 'weekly' ? rhythm.weeklyAt : rhythm.nightlyAt}
        onClose={() => setPicking(null)}
        onDone={at => {
          setRhythm(
            picking === 'weekly' ? { weeklyAt: at } : { nightlyAt: at },
          );
          setPicking(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  second: {
    marginTop: 28,
  },
});
