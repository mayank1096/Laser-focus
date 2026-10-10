import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { dayMark } from '../../core/home';
import type { BookData, Mark } from '../../core/model';
import { useT } from '../../i18n';
import { colors, fonts } from '../../theme';
import type { ISODate } from '../../types/models';
import { addDays, fromISODate } from '../../utils/date';
import { SaffronFill } from './MarkBox';

const GAP = 6;
const MAX_WEEKS = 26;
/** Monday first, as the review week reads. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const TRACK = 'rgba(0, 0, 0, 0.045)';

/**
 * The run as a calendar: weeks as rows, Monday first, each day with its
 * date. A full day is solid saffron, a half day filled half way up, a
 * missed day a soft grey tile; days with nothing planned are just their
 * date.
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
  const monday = (d: ISODate) =>
    addDays(d, -((fromISODate(d).getDay() + 6) % 7));
  const lastRow = monday(to);
  let firstRow = monday(from);
  if (addDays(firstRow, 7 * MAX_WEEKS) <= lastRow) {
    firstRow = addDays(lastRow, -7 * (MAX_WEEKS - 1));
  }
  const rows: ISODate[] = [];
  for (let d = firstRow; d <= lastRow; d = addDays(d, 7)) {
    rows.push(d);
  }
  const size = width ? Math.min(42, Math.floor((width - 6 * GAP) / 7)) : 0;
  return (
    <View
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      style={styles.grid}
    >
      {size ? (
        <>
          <View style={styles.row}>
            {ORDER.map(i => (
              <AppText
                key={i}
                variant="micro"
                style={[styles.letter, { width: size }]}
              >
                {t.common.dayLetter[i]}
              </AppText>
            ))}
          </View>
          {rows.map(row => {
            return (
              <View key={row} style={styles.week}>
                <View style={styles.row}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = addDays(row, i);
                    return (
                      <DayCell
                        key={d}
                        size={size}
                        iso={d}
                        inRun={d >= from && d <= to}
                        mark={dayMark(book, d)}
                        today={d === to}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

function DayCell({
  size,
  iso,
  inRun,
  mark,
  today,
}: {
  size: number;
  iso: ISODate;
  inRun: boolean;
  mark: Mark | null;
  today: boolean;
}) {
  const shown = inRun ? mark : null;
  const date = fromISODate(iso).getDate();
  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
        },
        shown === 'empty' || shown === 'half' ? styles.tile : null,
        today && styles.today,
      ]}
    >
      {shown === 'full' ? <SaffronFill id={`cal-${iso}`} /> : null}
      {shown === 'half' ? (
        <View style={styles.half}>
          <SaffronFill id={`cal-${iso}`} />
        </View>
      ) : null}
      <AppText
        style={[
          styles.date,
          !inRun && styles.dateOut,
          shown === 'full' && styles.dateOnFill,
          shown === 'empty' && styles.dateMissed,
        ]}
      >
        {String(date)}
      </AppText>
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
  week: {
    gap: 8,
  },
  letter: {
    textAlign: 'center',
    color: colors.textMuted,
  },
  cell: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tile: {
    backgroundColor: TRACK,
  },
  half: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    overflow: 'hidden',
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.saffron,
  },
  date: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  dateOut: {
    color: colors.textGhost,
  },
  dateOnFill: {
    color: colors.white,
  },
  dateMissed: {
    color: colors.textMuted,
  },
});
