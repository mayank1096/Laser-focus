import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { dayMark } from '../../core/home';
import type { BookData } from '../../core/model';
import { useT } from '../../i18n';
import { colors } from '../../theme';
import type { ISODate } from '../../types/models';
import { addDays, fromISODate } from '../../utils/date';
import { DayBox } from './MarkBox';

const GAP = 6;
const MAX_WEEKS = 26;

/**
 * Every day from `from` to `to`, one box each, weeks as rows. The same box
 * the day was marked with; nothing to read but the boxes.
 */
export function Calendar({
  book,
  from,
  to,
}: {
  book: Pick<BookData, 'sessions'>;
  from: ISODate;
  to: ISODate;
}) {
  const t = useT();
  const [width, setWidth] = useState(0);
  const lastRow = addDays(to, -fromISODate(to).getDay());
  let firstRow = addDays(from, -fromISODate(from).getDay());
  if (addDays(firstRow, 7 * MAX_WEEKS) <= lastRow) {
    firstRow = addDays(lastRow, -7 * (MAX_WEEKS - 1));
  }
  const rows: ISODate[] = [];
  for (let d = firstRow; d <= lastRow; d = addDays(d, 7)) {
    rows.push(d);
  }
  const size = width ? Math.min(32, Math.floor((width - 6 * GAP) / 7)) : 0;

  return (
    <View
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={styles.grid}
    >
      {size ? (
        <>
          <View style={styles.row}>
            {t.common.dayLetter.map((l, i) => (
              <AppText
                key={i}
                variant="micro"
                style={[styles.letter, { width: size }]}
              >
                {l}
              </AppText>
            ))}
          </View>
          {rows.map(row => (
            <View key={row} style={styles.row}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(row, i);
                return d < from || d > to ? (
                  <View key={d} style={{ width: size, height: size }} />
                ) : (
                  <DayBox
                    key={d}
                    size={size}
                    mark={dayMark(book, d)}
                    today={d === to}
                  />
                );
              })}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

/** Counts of full days and half days in a range. */
export function countDays(
  book: Pick<BookData, 'sessions'>,
  from: ISODate,
  to: ISODate,
) {
  let full = 0;
  let half = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const m = dayMark(book, d);
    full += m === 'full' ? 1 : 0;
    half += m === 'half' ? 1 : 0;
  }
  return { full, half };
}

const styles = StyleSheet.create({
  grid: {
    gap: GAP,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
  },
  letter: {
    textAlign: 'center',
    color: colors.textMuted,
  },
});
