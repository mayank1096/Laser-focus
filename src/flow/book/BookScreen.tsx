import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { appDay } from '../../core/days';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { dayDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { Calendar, countDays } from '../components/Calendar';
import { DayBox } from '../components/MarkBox';
import { SheetPage } from '../components/SheetPage';

/** Every session of this run, newest first, under the run's calendar. */
export function BookScreen({ navigation }: RootScreenProps<'Book'>) {
  const t = useT();
  const state = useBook();
  const today = appDay();
  const from = state.sprintStart ?? today;
  const { full, half } = countDays(state, from, today);
  const sessions = [...state.sessions]
    .filter(s => s.mark)
    .sort((a, b) =>
      a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1,
    );

  return (
    <SheetPage
      testID="book"
      eyebrow={t.sessionsPage.eyebrow}
      title={t.sessionsPage.title}
      subtitle={t.sessionsPage.sub}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.card}>
        <AppText variant="eyebrow">{t.book.calendar}</AppText>
        <Calendar book={state} from={from} to={today} />
        <AppText variant="label" style={styles.muted}>
          {t.goalDone.counts(full, half)}
        </AppText>
      </View>

      <View style={styles.card}>
        <AppText variant="eyebrow">{t.book.sessions}</AppText>
        {sessions.length ? (
          sessions.map((s, i) => (
            <View
              key={s.id}
              style={[styles.line, i < sessions.length - 1 && styles.divider]}
            >
              <DayBox size={20} mark={s.mark ?? null} />
              <View style={styles.flex}>
                <AppText variant="bodyMedium" numberOfLines={1}>
                  {s.what}
                </AppText>
                <AppText variant="micro" style={styles.muted} numberOfLines={1}>
                  {`${dayDate(t, s.date)} · ${t.common.minutes(s.minutes)}${
                    s.finished ? ` · ${s.finished}` : ''
                  }`}
                </AppText>
              </View>
            </View>
          ))
        ) : (
          <AppText variant="caption">{t.book.noSessions}</AppText>
        )}
      </View>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  flex: {
    flex: 1,
    gap: spacing.xs,
  },
  muted: {
    color: colors.textMuted,
  },
});
