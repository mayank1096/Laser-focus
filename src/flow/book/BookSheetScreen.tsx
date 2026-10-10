import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import ChevronRight from '../../assets/icons/chevron-right.svg';
import Flag from '../../assets/icons/flag.svg';
import Pencil from '../../assets/icons/pencil.svg';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { Goal } from '../../core/model';
import { haptics } from '../../utils/haptics';
import { SheetTitle } from '../components/SheetTitle';
import { AppText } from '../../components/AppText';
import { ListField } from '../../components/ListField';
import { appDay, weekStart } from '../../core/days';
import { activeMilestones, sprintProgress } from '../../core/home';
import { circledGoal, useBook } from '../../core/store';
import { PRATIGYAS, useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import { shortDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, fonts, spacing, typography } from '../../theme';
import { addDays } from '../../utils/date';
import {
  EditorAppearance,
  GoalsEditor,
  MilestonesEditor,
  TasksEditor,
  ValuesEditor,
} from '../components/SheetEditors';
import { MilestoneList } from '../components/MilestoneList';
import { SheetPage } from '../components/SheetPage';
import { vowText } from '../vow/TakeVowScreen';

const ANTI_GOAL_MAX = 4;
const SACRIFICE_MAX = 5;

/** One sheet of the book, open to edit. Everything saves as you type. */
export function BookSheetScreen({
  navigation,
  route,
}: RootScreenProps<'BookSheet'>) {
  const t = useT();
  const { sheet } = route.params;
  const state = useBook();
  const pratigya = useProfile(s => s.pratigya);
  const goal = circledGoal(state);
  const week = weekStart(appDay(), state.rhythm.reviewDay);
  const [switchTo, setSwitchTo] = useState<Goal | null>(null);
  const [endSure, setEndSure] = useState(false);
  const [editing, setEditing] = useState(false);
  const progress = sprintProgress(state, appDay());

  const head: Record<typeof sheet, { eyebrow: string; sub: string }> = {
    values: { eyebrow: t.bookTab.valuesMeta, sub: t.bookSheet.valuesSub },
    goals: { eyebrow: t.bookTab.goalsMeta, sub: t.bookSheet.goalsSub },
    milestones: {
      eyebrow: t.bookTab.milestonesMeta(
        state.milestones.filter(
          m => m.goalId === state.circledGoalId && !m.archived && m.done,
        ).length,
        state.milestones.filter(
          m => m.goalId === state.circledGoalId && !m.archived,
        ).length,
      ),
      sub: t.bookSheet.milestonesSub,
    },
    week: {
      eyebrow: t.bookTab.tasksMeta(
        `${shortDate(t, week)} – ${shortDate(t, addDays(week, 6))}`,
        state.tasks.filter(x => x.week === week).length,
      ),
      sub: goal?.text ?? '',
    },
    antiGoal: { eyebrow: t.bookTab.antiGoalMeta, sub: t.review.antiGoalSub },
    sacrifice: {
      eyebrow: t.bookTab.sacrificeMeta,
      sub: t.review.sacrificeSub,
    },
    vow: {
      eyebrow: pratigya ? `${PRATIGYAS[pratigya].name} प्रतिज्ञा` : '',
      sub: t.bookSheet.vowSub,
    },
  };

  return (
    <SheetPage
      testID={`sheet-${sheet}`}
      eyebrow={head[sheet].eyebrow}
      title={sheet === 'week' ? t.bookTab.tasks : t.book[sheet]}
      subtitle={head[sheet].sub}
      panel={sheet === 'week' ? colors.white : undefined}
      onBack={() => navigation.goBack()}
    >
      <EditorAppearance.Provider value="card">
        {sheet === 'values' ? <ValuesEditor /> : null}
        {sheet === 'goals' ? (
          <>
            <GoalsEditor />
            {state.goals.filter(g => g.id !== state.circledGoalId && !g.doneAt)
              .length ? (
              <View style={styles.switch}>
                <AppText variant="eyebrow">{t.book.switchGoal}</AppText>
                {state.goals
                  .filter(g => g.id !== state.circledGoalId && !g.doneAt)
                  .map(g => (
                    <Pressable
                      key={g.id}
                      testID={`switch-${g.id}`}
                      accessibilityRole="button"
                      onPress={() => setSwitchTo(g)}
                      style={styles.switchRow}
                    >
                      <AppText variant="body" style={styles.flex}>
                        {g.text}
                      </AppText>
                      <AppText variant="label" style={styles.link}>
                        {t.book.switchGoal}
                      </AppText>
                    </Pressable>
                  ))}
              </View>
            ) : null}
          </>
        ) : null}
        {sheet === 'milestones' ? (
          <>
            {editing ? (
              <>
                <View style={styles.editBar}>
                  <AppText variant="eyebrow">
                    {t.bookSheet.editMilestones}
                  </AppText>
                  <SmallPill
                    testID="edit-milestones"
                    label={t.common.done}
                    accent
                    onPress={() => setEditing(false)}
                  />
                </View>
                <MilestonesEditor />
              </>
            ) : (
              <View style={styles.card} testID="milestones-card">
                {goal ? (
                  <View style={styles.cardHeadRow}>
                    <View style={styles.cardHead}>
                      <AppText style={styles.cardTitle}>{goal.text}</AppText>
                      <AppText style={styles.cardSub}>
                        {`${t.today.milestones(
                          progress.milestonesDone,
                          progress.milestonesTotal,
                        )} · ${t.today.left(
                          progress.monthsLeft,
                          progress.daysLeft,
                        )}`}
                      </AppText>
                    </View>
                    <SmallPill
                      testID="edit-milestones"
                      label={t.bookSheet.edit}
                      Icon={Pencil}
                      onPress={() => setEditing(true)}
                    />
                  </View>
                ) : null}
                <MilestoneList
                  milestones={activeMilestones(state)}
                  testIDPrefix="sheet-ms"
                />
              </View>
            )}
            {editing ? null : (
              <Pressable
                testID="end-sprint"
                accessibilityRole="button"
                onPress={() => {
                  haptics.selection();
                  setEndSure(true);
                }}
                style={({ pressed }) => [
                  styles.endRow,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.endIcon}>
                  <Flag
                    width={16}
                    height={16}
                    color={colors.ink}
                    strokeWidth={1.75}
                  />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyMedium">{t.book.endSprint}</AppText>
                  <AppText variant="detail">{t.bookSheet.endSprintSub}</AppText>
                </View>
                <ChevronRight
                  width={16}
                  height={16}
                  color={colors.textMuted}
                  strokeWidth={2}
                />
              </Pressable>
            )}
          </>
        ) : null}
        {sheet === 'week' ? (
          <TasksEditor week={week} cardColor={colors.stone} />
        ) : null}
        {sheet === 'antiGoal' ? (
          <ListField
            testID="antigoal-list"
            appearance="card"
            items={state.antiGoals}
            onChange={state.setAntiGoals}
            max={ANTI_GOAL_MAX}
            addLabel={t.book.add}
            idPrefix="anti"
          />
        ) : null}
        {sheet === 'sacrifice' ? (
          <View style={styles.gap}>
            <AppText variant="eyebrow">{t.book.giveUp}</AppText>
            <ListField
              testID="giveup-list"
              appearance="card"
              items={state.giveUp}
              onChange={state.setGiveUp}
              max={SACRIFICE_MAX}
              addLabel={t.book.add}
              idPrefix="give"
            />
            <AppText variant="eyebrow" style={styles.second}>
              {t.book.keep}
            </AppText>
            <ListField
              testID="keep-list"
              appearance="card"
              items={state.keep}
              onChange={state.setKeep}
              max={SACRIFICE_MAX}
              addLabel={t.book.add}
              idPrefix="keep"
            />
          </View>
        ) : null}
        {sheet === 'vow' && pratigya && goal ? (
          <View style={styles.vow}>
            <AppText style={styles.vowText}>
              {vowText(t, pratigya, goal.text)}
            </AppText>
          </View>
        ) : null}
      </EditorAppearance.Provider>

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
              navigation.replace('BookSheet', { sheet: 'milestones' });
            }
          }}
        />
      </BottomSheet>

      <BottomSheet
        visible={endSure}
        onClose={() => setEndSure(false)}
        accessibilityLabel={t.book.endSprint}
      >
        <SheetTitle
          title={t.book.endSprint}
          subtitle={t.goalDone.endSprintSure}
        />
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
    </SheetPage>
  );
}

/** A compact action that sits beside a heading: Edit, Done. */
function SmallPill({
  label,
  onPress,
  Icon,
  accent = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  Icon?: React.FC<SvgProps>;
  accent?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.pill,
        accent && styles.pillAccent,
        pressed && styles.pressed,
      ]}
    >
      {Icon ? (
        <Icon width={13} height={13} color={colors.ink} strokeWidth={1.75} />
      ) : null}
      <AppText style={[styles.pillText, accent && styles.pillTextAccent]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  switch: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  link: {
    color: colors.saffron,
  },
  // Figma 2.05: a white card, 22 in from the edge, 30 below the panel's top.
  card: {
    marginHorizontal: 4,
    marginTop: 12,
    padding: 16,
    gap: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: colors.white,
    boxShadow: '0px 24px 18px rgba(0, 0, 0, 0.08)',
  },
  cardHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.045)',
  },
  pillAccent: {
    backgroundColor: colors.saffronWash,
    borderWidth: 1,
    borderColor: colors.saffron,
  },
  pillText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.26,
    color: colors.ink,
  },
  pillTextAccent: {
    color: colors.saffron,
  },
  pressed: {
    opacity: 0.7,
  },
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 4,
    marginTop: 12,
    marginBottom: 4,
  },
  endRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 4,
    marginTop: spacing.group,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: colors.white,
  },
  endIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.045)',
  },
  cardHead: {
    flex: 1,
    gap: 10,
  },
  cardTitle: {
    fontFamily: fonts.serif,
    fontSize: 16,
    lineHeight: 17.6,
    letterSpacing: -0.32,
    color: colors.ink,
  },
  cardSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 15.6,
    letterSpacing: 0.24,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  gap: {
    gap: spacing.md,
  },
  second: {
    marginTop: spacing.lg,
  },
  vow: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  vowText: {
    ...typography.heading,
    lineHeight: 28,
  },
});
