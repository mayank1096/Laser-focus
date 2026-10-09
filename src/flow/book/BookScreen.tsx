import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Pencil from '../../assets/icons/pencil.svg';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SimpleScreen } from '../../components/SimpleScreen';
import { appDay, weekStart } from '../../core/days';
import { activeMilestones } from '../../core/home';
import type { Goal } from '../../core/model';
import { circledGoal, useBook } from '../../core/store';
import { useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import { dayDate } from '../../i18n/format';
import type { BookSheet, RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';
import { Calendar, countDays } from '../components/Calendar';
import { DayBox } from '../components/MarkBox';
import { SheetTitle } from '../components/SheetTitle';
import { CheckRow } from '../sprint/ReviewScreen';
import { vowText } from '../vow/TakeVowScreen';

const RECENT = 12;

/** The whole book on one page. Each sheet opens to edit. */
export function BookScreen({ navigation }: RootScreenProps<'Book'>) {
  const t = useT();
  const state = useBook();
  const pratigya = useProfile(s => s.pratigya);
  const goal = circledGoal(state);
  const today = appDay();
  const week = weekStart(today, state.rhythm.reviewDay);
  const milestones = activeMilestones(state);
  const deep = state.tasks.filter(x => x.week === week && x.kind === 'deep');
  const from = state.sprintStart ?? today;
  const { full, half } = countDays(state, from, today);
  const recent = [...state.sessions]
    .filter(s => s.mark)
    .sort((a, b) =>
      a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1,
    )
    .slice(0, RECENT);
  const [switchTo, setSwitchTo] = useState<Goal | null>(null);
  const [endSure, setEndSure] = useState(false);
  const [printNote, setPrintNote] = useState(false);
  const edit = (sheet: BookSheet) => () => navigation.navigate('BookSheet', { sheet });

  return (
    <>
      <SimpleScreen
        testID="book"
        tone="parchment"
        onBack={() => navigation.goBack()}
        footer={null}
      >
        <AppText variant="eyebrow">{t.book.title}</AppText>
        {goal ? (
          <AppText style={[typography.display, styles.goal]}>{goal.text}</AppText>
        ) : null}

        <Card title={t.book.values} onEdit={edit('values')} testID="book-values">
          {state.values.map(v => (
            <AppText key={v.id} variant="body">
              {v.text}
            </AppText>
          ))}
        </Card>

        <Card title={t.book.goals} onEdit={edit('goals')} testID="book-goals">
          {state.goals.map(g => (
            <View key={g.id} style={styles.line}>
              <AppText
                variant={g.id === state.circledGoalId ? 'bodyMedium' : 'body'}
                style={[styles.flex, g.doneAt ? styles.muted : null]}
              >
                {g.text}
              </AppText>
              {g.id === state.circledGoalId ? (
                <Tag label={t.book.current} dark />
              ) : g.doneAt ? (
                <Tag label={t.reassess.reached} />
              ) : (
                <Tag
                  testID={`switch-${g.id}`}
                  label={t.book.switchGoal}
                  onPress={() => setSwitchTo(g)}
                />
              )}
            </View>
          ))}
        </Card>

        <Card title={t.book.milestones} onEdit={edit('milestones')} testID="book-milestones">
          {milestones.map(m => (
            <CheckRow
              key={m.id}
              testID={`book-ms-${m.id}`}
              label={m.text}
              checked={m.done}
              onPress={() => state.toggleMilestone(m.id)}
            />
          ))}
          <Link testID="end-sprint" label={t.book.endSprint} onPress={() => setEndSure(true)} />
        </Card>

        <Card title={t.book.week} onEdit={edit('week')} testID="book-week">
          {deep.map(task => (
            <CheckRow
              key={task.id}
              label={task.text}
              checked={task.done}
              onPress={() => state.toggleTask(task.id)}
            />
          ))}
        </Card>

        <Card title={t.book.antiGoal} onEdit={edit('antiGoal')} testID="book-antigoal">
          {state.antiGoals.length ? (
            state.antiGoals.map(a => (
              <AppText key={a.id} variant="body">
                {a.text}
              </AppText>
            ))
          ) : (
            <AppText variant="caption">{t.review.antiGoalSub}</AppText>
          )}
        </Card>

        <Card title={t.book.sacrifice} onEdit={edit('sacrifice')} testID="book-sacrifice">
          {state.giveUp.length || state.keep.length ? (
            <>
              {state.giveUp.map(a => (
                <AppText key={a.id} variant="body">
                  {`${t.book.giveUp}: ${a.text}`}
                </AppText>
              ))}
              {state.keep.map(a => (
                <AppText key={a.id} variant="body">
                  {`${t.book.keep}: ${a.text}`}
                </AppText>
              ))}
            </>
          ) : (
            <AppText variant="caption">{t.review.sacrificeSub}</AppText>
          )}
        </Card>

        {pratigya && goal ? (
          <Card title={t.book.vow}>
            <AppText variant="body">{vowText(t, pratigya, goal.text)}</AppText>
          </Card>
        ) : null}

        <Card title={t.book.calendar}>
          <Calendar book={state} from={from} to={today} />
          <AppText variant="label" style={styles.muted}>
            {t.goalDone.counts(full, half)}
          </AppText>
        </Card>

        <Card title={t.book.sessions}>
          {recent.length ? (
            recent.map(s => (
              <View key={s.id} style={styles.line}>
                <DayBox size={18} mark={s.mark ?? null} />
                <View style={styles.flex}>
                  <AppText variant="body" numberOfLines={1}>
                    {s.what}
                  </AppText>
                  <AppText variant="micro" style={styles.muted}>
                    {`${dayDate(t, s.date)} · ${t.common.minutes(s.minutes)}`}
                  </AppText>
                </View>
              </View>
            ))
          ) : (
            <AppText variant="caption">{t.book.noSessions}</AppText>
          )}
        </Card>

        <View style={styles.print}>
          <Link testID="book-print" label={t.book.print} onPress={() => setPrintNote(true)} />
          {printNote ? (
            <AppText variant="caption">{t.setupDone.printSoon}</AppText>
          ) : null}
        </View>
      </SimpleScreen>

      <BottomSheet
        visible={switchTo !== null}
        onClose={() => setSwitchTo(null)}
        accessibilityLabel={t.book.switchGoal}
      >
        <SheetTitle title={switchTo?.text ?? ''} subtitle={t.book.switchSure} />
        <PrimaryButton
          testID="switch-confirm"
          label={t.book.switchGoal}
          shadow="none"
          onPress={() => {
            if (switchTo) {
              useBook.getState().switchGoal(switchTo.id);
              haptics.success();
              setSwitchTo(null);
              navigation.navigate('BookSheet', { sheet: 'milestones' });
            }
          }}
        />
      </BottomSheet>

      <BottomSheet
        visible={endSure}
        onClose={() => setEndSure(false)}
        accessibilityLabel={t.book.endSprint}
      >
        <SheetTitle title={t.book.endSprint} subtitle={t.goalDone.endSprintSure} />
        <PrimaryButton
          testID="end-confirm"
          label={t.book.endSprint}
          shadow="none"
          onPress={() => {
            setEndSure(false);
            navigation.navigate('GoalDone');
          }}
        />
      </BottomSheet>
    </>
  );
}

function Card({
  title,
  onEdit,
  children,
  testID,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.cardHead}>
        <AppText variant="eyebrow" style={styles.flex}>
          {title}
        </AppText>
        {onEdit ? (
          <Pressable
            testID={testID ? `${testID}-edit` : undefined}
            accessibilityRole="button"
            accessibilityLabel={title}
            hitSlop={10}
            onPress={() => {
              haptics.selection();
              onEdit();
            }}
          >
            <Pencil width={16} height={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Tag({
  label,
  dark,
  onPress,
  testID,
}: {
  label: string;
  dark?: boolean;
  onPress?: () => void;
  testID?: string;
}) {
  const body = (
    <View style={[styles.tag, dark && styles.tagDark]}>
      <AppText variant="micro" style={dark ? styles.onDark : styles.muted}>
        {label}
      </AppText>
    </View>
  );
  return onPress ? (
    <Pressable testID={testID} accessibilityRole="button" hitSlop={6} onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

function Link({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable testID={testID} accessibilityRole="button" hitSlop={8} onPress={onPress}>
      <AppText variant="label" style={styles.link}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  goal: {
    marginTop: spacing.sm,
  },
  card: {
    marginTop: spacing.lg,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: colors.textMuted,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  tagDark: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  onDark: {
    color: colors.white,
  },
  link: {
    color: colors.saffron,
  },
  print: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
});
