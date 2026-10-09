import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { ListField } from '../../components/ListField';
import { circledGoal, tasksForWeek, useBook } from '../../core/store';
import { activeMilestones } from '../../core/home';
import { Chip, ChipRow } from '../../components/Chip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RulerPicker } from '../../components/RulerPicker';
import {
  LIMITS,
  TERM_RANGE,
  TERMS,
  type Goal,
  type TaskKind,
} from '../../core/model';
import { useT } from '../../i18n';
import { monthLabel } from '../../i18n/format';
import { colors, motion, radii, spacing } from '../../theme';
import type { ISODate } from '../../types/models';
import { haptics } from '../../utils/haptics';
import { MonthPickerSheet } from './MonthPickerSheet';
import { SheetTitle } from './SheetTitle';

/** The values sheet: the course's lines, every one editable. */
export function ValuesEditor() {
  const t = useT();
  const values = useBook(s => s.values);
  const setValues = useBook(s => s.setValues);
  return (
    <ListField
      testID="values-list"
      items={values}
      onChange={setValues}
      max={15}
      min={LIMITS.values.min}
      addLabel={t.values.add}
      idPrefix="value"
    />
  );
}

/** Goal rows, each with a term pill that opens a years picker. */
export function GoalsEditor() {
  const t = useT();
  const goals = useBook(s => s.goals);
  const setGoals = useBook(s => s.setGoals);
  const [editing, setEditing] = useState<Goal | null>(null);
  const lines = goals.map(g => ({ id: g.id, text: g.text }));
  return (
    <View style={styles.gap}>
      <ListField
        testID="goals-list"
        items={lines}
        onChange={setGoals}
        max={LIMITS.goals.max}
        min={LIMITS.goals.min}
        addLabel={t.goals.examples[goals.length] ?? t.goals.add}
        idPrefix="goal"
        inlineTrailing
        renderTrailing={item => {
          const goal = goals.find(g => g.id === item.id);
          if (!goal) {
            return null;
          }
          return (
            <Pill
              testID={`term-${goal.id}`}
              label={t.goals.term(goal.term)}
              onPress={() => setEditing(goal)}
            />
          );
        }}
      />
      {goals.length >= LIMITS.goals.max ? (
        <AppText variant="caption">{t.goals.full}</AppText>
      ) : null}
      <TermSheet goal={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

/** Any number of years: drag the ruler, or tap a common one. */
function TermSheet({
  goal,
  onClose,
}: {
  goal: Goal | null;
  onClose: () => void;
}) {
  const t = useT();
  const setTerm = useBook(s => s.setGoalTerm);
  const term = useBook(s => s.goals.find(g => g.id === goal?.id)?.term ?? 5);
  return (
    <BottomSheet
      visible={goal !== null}
      onClose={onClose}
      accessibilityLabel={t.goals.termTitle}
    >
      <SheetTitle title={t.goals.termTitle} subtitle={goal?.text} />
      {goal ? (
        <View style={styles.termBody}>
          <RulerPicker
            testID="term-ruler"
            value={term}
            min={TERM_RANGE.min}
            max={TERM_RANGE.max}
            onChange={y => setTerm(goal.id, y)}
            formatLabel={t.goals.termYears}
            accessibilityLabel={t.goals.termTitle}
          />
          <ChipRow wrap>
            {TERMS.map(y => (
              <Chip
                key={y}
                testID={`term-pick-${y}`}
                role="radio"
                label={t.goals.term(y)}
                selected={term === y}
                onPress={() => setTerm(goal.id, y)}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}
      <PrimaryButton
        testID="term-done"
        label={t.common.done}
        shadow="none"
        onPress={onClose}
      />
    </BottomSheet>
  );
}

/** The circled goal's milestones, each with an optional target month. */
export function MilestonesEditor() {
  const t = useT();
  const state = useBook();
  const goal = circledGoal(state);
  const mine = activeMilestones(state);
  const [picking, setPicking] = useState<string | null>(null);
  const picked = mine.find(m => m.id === picking);
  return (
    <>
      <ListField
        testID="milestones-list"
        items={mine.map(m => ({ id: m.id, text: m.text }))}
        onChange={state.setMilestoneLines}
        max={12}
        min={LIMITS.milestones.min}
        addLabel={t.milestones.add}
        placeholder={t.milestones.placeholder}
        idPrefix="milestone"
        inlineTrailing
        renderTrailing={item => {
          const m = mine.find(x => x.id === item.id);
          return (
            <Pill
              testID={`month-${item.id}`}
              label={m?.month ? monthLabel(t, m.month) : t.milestones.noMonth}
              muted={!m?.month}
              onPress={() => setPicking(item.id)}
            />
          );
        }}
      />
      <MonthPickerSheet
        visible={picked != null}
        onClose={() => setPicking(null)}
        title={picked?.text ?? ''}
        value={picked?.month}
        runMonths={(goal?.term ?? 2) * 12}
        taken={mine
          .filter(m => m.id !== picking && m.month)
          .map(m => m.month as string)}
        onPick={month => picking && state.setMilestoneMonth(picking, month)}
      />
    </>
  );
}

/**
 * One week's task list. Deep tasks link to a milestone (default: the first
 * unticked one); shallow work has a collapsed list of its own.
 */
export function TasksEditor({
  week,
  showShallow = true,
}: {
  week: ISODate;
  showShallow?: boolean;
}) {
  const t = useT();
  const state = useBook();
  const deep = state.tasks.filter(x => x.week === week && x.kind === 'deep');
  const shallow = state.tasks.filter(
    x => x.week === week && x.kind === 'shallow',
  );
  const milestones = activeMilestones(state).filter(m => !m.done);
  const [linking, setLinking] = useState<string | null>(null);
  const [openShallow, setOpenShallow] = useState(shallow.length > 0);
  const set = (kind: TaskKind) => (lines: { id: string; text: string }[]) =>
    state.setTaskLines(week, kind, lines);

  return (
    <View style={styles.gap}>
      <ListField
        testID="tasks-list"
        items={deep.map(x => ({ id: x.id, text: x.text }))}
        onChange={set('deep')}
        max={LIMITS.deep.max}
        min={LIMITS.deep.min}
        addLabel={t.tasks.add}
        placeholder={t.tasks.placeholder}
        idPrefix="task"
        inlineTrailing
        renderTrailing={item => {
          const task = deep.find(x => x.id === item.id);
          const m = state.milestones.find(x => x.id === task?.milestoneId);
          const n = activeMilestones(state).findIndex(x => x.id === m?.id);
          return milestones.length ? (
            <Pill
              testID={`link-${item.id}`}
              label={n >= 0 ? `M${n + 1}` : '—'}
              onPress={() => setLinking(item.id)}
            />
          ) : null;
        }}
      />
      {deep.length >= LIMITS.deep.max ? (
        <AppText variant="caption">{t.tasks.full}</AppText>
      ) : null}

      {showShallow ? (
        <View>
          <Pressable
            testID="shallow-toggle"
            accessibilityRole="button"
            accessibilityState={{ expanded: openShallow }}
            onPress={() => {
              haptics.selection();
              setOpenShallow(o => !o);
            }}
            style={styles.toggle}
          >
            <View style={styles.flex}>
              <AppText variant="bodyMedium">{t.tasks.shallowToggle}</AppText>
              <AppText variant="micro" style={styles.muted}>
                {t.tasks.shallowSub}
              </AppText>
            </View>
            <ChevronDown
              width={18}
              height={18}
              color={colors.textMuted}
              style={{
                transform: [{ rotate: openShallow ? '180deg' : '0deg' }],
              }}
            />
          </Pressable>
          {openShallow ? (
            <Animated.View
              entering={FadeIn.duration(motion.base)}
              exiting={FadeOut.duration(motion.fast)}
              style={styles.shallow}
            >
              <ListField
                testID="shallow-list"
                items={shallow.map(x => ({ id: x.id, text: x.text }))}
                onChange={set('shallow')}
                max={10}
                addLabel={t.tasks.shallowAdd}
                placeholder={t.tasks.shallowPlaceholder}
                idPrefix="shallow"
              />
            </Animated.View>
          ) : null}
        </View>
      ) : null}

      <BottomSheet
        visible={linking !== null}
        onClose={() => setLinking(null)}
        accessibilityLabel={t.tasks.moves}
      >
        <SheetTitle title={t.tasks.moves} />
        <View style={styles.options}>
          {milestones.map(m => {
            const n = activeMilestones(state).findIndex(x => x.id === m.id);
            const on = deep.find(x => x.id === linking)?.milestoneId === m.id;
            return (
              <Pressable
                key={m.id}
                testID={`link-to-${m.id}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  haptics.selection();
                  if (linking) {
                    state.setTaskMilestone(linking, m.id);
                  }
                  setLinking(null);
                }}
                style={[styles.option, on && styles.optionOn]}
              >
                <AppText variant="label" style={styles.muted}>
                  {`M${n + 1}`}
                </AppText>
                <AppText variant="bodyMedium" style={styles.flex}>
                  {m.text}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

/** A small rounded label inside a list row. */
export function Pill({
  label,
  onPress,
  muted = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      hitSlop={6}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={styles.pill}
    >
      <AppText variant="label" style={muted ? styles.muted : null}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** This week's deep tasks that are still open, for the plan picker. */
export function useOpenTasks(date: ISODate) {
  const state = useBook();
  return useMemo(
    () => tasksForWeek(state, date, 'deep').filter(x => !x.done),
    [state, date],
  );
}

const styles = StyleSheet.create({
  termBody: {
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  gap: {
    gap: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: colors.textMuted,
  },
  pill: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chip,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  shallow: {
    marginTop: spacing.sm,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  optionOn: {
    borderColor: colors.saffron,
    backgroundColor: colors.saffronWash,
  },
});
