import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ScrollText from '../../assets/icons/scroll-text.svg';
import { AppText } from '../../components/AppText';
import { SettingsRow, SettingsSection } from '../../components/SettingsList';
import { appDay } from '../../core/days';
import { dayMark } from '../../core/home';
import type { Session } from '../../core/model';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clock, dayDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { Calendar, countDays } from '../components/Calendar';
import { DayBox } from '../components/MarkBox';
import { SheetPage } from '../components/SheetPage';

/**
 * Every session of this run. The calendar on top, then a ruled log, one
 * day at a time, newest first: the day and its box, then each session
 * with its start time in a column on the left.
 */
export function BookScreen({ navigation }: RootScreenProps<'Book'>) {
  const t = useT();
  const state = useBook();
  const today = appDay();
  const from = state.sprintStart ?? today;
  const { full, half } = countDays(state, from, today);
  const [printNote, setPrintNote] = useState(false);

  const byDay = new Map<string, Session[]>();
  [...state.sessions]
    .filter(s => s.mark)
    .sort((a, b) =>
      a.date === b.date ? a.order - b.order : a.date < b.date ? 1 : -1,
    )
    .forEach(s => byDay.set(s.date, [...(byDay.get(s.date) ?? []), s]));
  const days = [...byDay.entries()];

  return (
    <SheetPage
      testID="book"
      eyebrow={t.sessionsPage.eyebrow}
      title={t.sessionsPage.title}
      subtitle={t.sessionsPage.sub}
      panel={colors.white}
      onBack={() => navigation.goBack()}
    >
      <View style={styles.section}>
        <View style={styles.head}>
          <AppText variant="eyebrow">{t.book.calendar}</AppText>
          <AppText variant="detail">{t.goalDone.counts(full, half)}</AppText>
        </View>
        <Calendar book={state} from={from} to={today} />
      </View>

      <View style={styles.section}>
        <AppText variant="eyebrow">{t.book.sessions}</AppText>
        {days.length ? (
          <View style={styles.log}>
            {days.map(([date, list]) => (
              <View key={date} style={styles.day}>
                <View style={styles.dayHead}>
                  <AppText variant="bodyMedium">{dayDate(t, date)}</AppText>
                  <DayBox size={18} mark={dayMark(state, date)} />
                </View>
                {list.map(s => (
                  <View key={s.id} style={styles.row}>
                    <AppText variant="detail" style={styles.time}>
                      {clock(t, s.start)}
                    </AppText>
                    <View style={styles.flex}>
                      <AppText variant="body" numberOfLines={1}>
                        {s.what}
                      </AppText>
                      <AppText variant="detail" numberOfLines={1}>
                        {[t.common.minutes(s.minutes), s.finished]
                          .filter(Boolean)
                          .join(' · ')}
                      </AppText>
                    </View>
                    {list.length > 1 ? (
                      <DayBox size={14} mark={s.mark ?? null} />
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <AppText variant="detail">{t.book.noSessions}</AppText>
        )}
      </View>

      <SettingsSection>
        <SettingsRow
          testID="book-print"
          Icon={ScrollText}
          title={t.book.print}
          detail={printNote ? t.setupDone.printSoon : t.settings.printSub}
          onPress={() => setPrintNote(true)}
          last
        />
      </SettingsSection>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
    marginBottom: spacing.group,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  log: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  day: {
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  time: {
    width: 64,
    paddingTop: 2,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
});
