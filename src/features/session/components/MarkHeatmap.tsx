import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import ChevronLeft from '../../../assets/icons/chevron-left.svg';
import ChevronRight from '../../../assets/icons/chevron-right.svg';
import { AppText } from '../../../components/AppText';
import { colors, motion, spacing } from '../../../theme';
import { today as todayISO } from '../../../utils/clock';
import { addDays, fromISODate, startOfWeek } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import type { ISODate } from '../../../types/models';
import { planFor, usePlanning } from '../../planning/store';
import { dayMark, useSessions, type DayMark } from '../store';

const WEEKS = 14;
const GAP = 4;
const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

type Cell = 'full' | 'half' | 'missed' | 'rest' | 'before' | 'ahead';

const FILL: Record<Cell, string> = {
  full: colors.saffron,
  half: '#FBC48F',
  missed: '#F1E4D8',
  rest: '#F7EFE8',
  before: 'rgba(0, 0, 0, 0.025)',
  ahead: 'transparent',
};

const label = (iso: ISODate) => {
  const d = fromISODate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/**
 * Fourteen weeks of marks as a grid: a column per week, a row per weekday.
 * Saffron for a full mark, pale saffron for a half, warm grey for a day a
 * session was planned and missed. Page back through earlier weeks.
 */
export function MarkHeatmap({ runStart }: { runStart: ISODate }) {
  const sessions = useSessions();
  const planning = usePlanning();
  const today = todayISO();
  const [page, setPage] = useState(0);
  const [width, setWidth] = useState(0);

  const lastMonday = addDays(startOfWeek(today), -7 * WEEKS * page);
  const firstMonday = addDays(lastMonday, -7 * (WEEKS - 1));
  const earliest = startOfWeek(runStart);
  const canBack = firstMonday > earliest;

  const cellOf = (d: ISODate): Cell => {
    if (d > today) {
      return 'ahead';
    }
    if (d < runStart) {
      return 'before';
    }
    const m: DayMark = dayMark(sessions, planning, d, today);
    if (m === 'full' || m === 'half') {
      return m;
    }
    const planned = planFor(planning, d).sessions.some(s => s.task);
    return planned && d < today ? 'missed' : 'rest';
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
                    />
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
          label="Earlier weeks"
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
          label="Later weeks"
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
  cell: {},
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
