import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import ChevronLeft from '../../assets/icons/chevron-left.svg';
import ChevronRight from '../../assets/icons/chevron-right.svg';
import { AppText } from '../../components/AppText';
import { appDay, weekStart } from '../../core/days';
import { dayMark } from '../../core/home';
import type { BookData } from '../../core/model';
import { useT } from '../../i18n';
import { shortDate } from '../../i18n/format';
import { colors, motion, spacing } from '../../theme';
import type { ISODate } from '../../types/models';
import { addDays, fromISODate } from '../../utils/date';
import { haptics } from '../../utils/haptics';

const WEEKS = 14;
const GAP = 4;
/** Weeks run Monday to Sunday here; Sunday is index 0 in the strings. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

type Cell = 'full' | 'half' | 'missed' | 'rest' | 'before' | 'ahead';

const FILL: Record<Cell, string> = {
  full: colors.saffron,
  // A half day: the empty tile, filled half way up in saffron.
  half: '#F1E4D8',
  missed: '#F1E4D8',
  rest: '#F7EFE8',
  before: 'rgba(0, 0, 0, 0.025)',
  ahead: 'transparent',
};

/**
 * Fourteen weeks of marks as a grid: a column per week, a row per weekday.
 * Saffron for a full day, half filled for a half day, warm grey for a day
 * that was planned and didn't happen. Page back through earlier weeks.
 */
export function MarkHeatmap({
  book,
  runStart,
}: {
  book: Pick<BookData, 'sessions'>;
  runStart: ISODate;
}) {
  const t = useT();
  const today = appDay();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);
  const label = (iso: ISODate) =>
    `${shortDate(t, iso)} ${fromISODate(iso).getFullYear()}`;
  const LETTERS = ORDER.map(i => t.common.dayLetter[i]);

  const lastMonday = addDays(weekStart(today, 0), -7 * WEEKS * page);
  const firstMonday = addDays(lastMonday, -7 * (WEEKS - 1));
  const earliest = weekStart(runStart, 0);
  const canBack = firstMonday > earliest;

  const cellOf = (d: ISODate): Cell => {
    if (d > today) {
      return 'ahead';
    }
    if (d < runStart) {
      return 'before';
    }
    const m = dayMark(book, d);
    if (m === 'full' || m === 'half') {
      return m;
    }
    return m === 'empty' ? 'missed' : 'rest';
  };

  const cell = width ? Math.floor((width - 22 - (WEEKS - 1) * GAP) / WEEKS) : 0;
  const end = addDays(lastMonday, 6) > today ? today : addDays(lastMonday, 6);

  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {cell ? (
        <Animated.View
          key={page}
          entering={FadeIn.duration(motion.base)}
          style={styles.grid}
        >
          <View style={[styles.letters, { gap: GAP }]}>
            {LETTERS.map((l, i) => (
              <AppText
                key={i}
                variant="micro"
                style={[styles.letter, { height: cell, lineHeight: cell }]}
              >
                {l}
              </AppText>
            ))}
          </View>
          {Array.from({ length: WEEKS }, (_, w) => {
            const monday = addDays(firstMonday, w * 7);
            return (
              <View key={monday} style={{ gap: GAP }}>
                {LETTERS.map((_l, i) => {
                  const d = addDays(monday, i);
                  const c = cellOf(d);
                  return (
                    <View
                      key={d}
                      style={[
                        styles.cell,
                        {
                          width: cell,
                          height: cell,
                          borderRadius: Math.round(cell * 0.3),
                          backgroundColor: FILL[c],
                        },
                        c === 'ahead' && styles.ahead,
                        d === today && styles.today,
                      ]}
                    >
                      {c === 'half' ? <View style={styles.halfFill} /> : null}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </Animated.View>
      ) : null}

      <View style={styles.footer}>
        <Pager
          Icon={ChevronLeft}
          label={t.account.earlier}
          disabled={!canBack}
          onPress={() => setPage(p => p + 1)}
        />
        <AppText variant="label" style={styles.range}>
          {`${label(firstMonday < runStart ? runStart : firstMonday)} — ${label(
            end,
          )}`}
        </AppText>
        <Pager
          Icon={ChevronRight}
          label={t.account.later}
          disabled={page === 0}
          onPress={() => setPage(p => Math.max(0, p - 1))}
        />
      </View>
    </View>
  );
}

function Pager({
  Icon,
  label: a11y,
  disabled,
  onPress,
}: {
  Icon: typeof ChevronLeft;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={[styles.pager, disabled && styles.pagerOff]}
    >
      <Icon width={16} height={16} color={colors.ink} strokeWidth={1.8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: GAP,
  },
  letters: {
    width: 18,
  },
  letter: {
    color: colors.textMuted,
    textAlign: 'left',
  },
  cell: {
    overflow: 'hidden',
  },
  halfFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: colors.saffron,
  },
  ahead: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    borderStyle: 'dashed',
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.saffron,
    borderStyle: 'solid',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 18,
  },
  range: {
    flex: 1,
    textAlign: 'center',
    color: colors.ink,
  },
  pager: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.stone,
  },
  pagerOff: {
    opacity: 0.35,
  },
});
