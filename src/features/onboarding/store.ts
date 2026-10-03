import { create } from 'zustand';
import type {
  AntiGoal,
  Goal,
  GoalPlan,
  Id,
  Milestone,
  SheetLine,
  Value,
  WorkShape,
} from '../../types/models';
import { createId } from '../../utils/id';
import { distributeDueMonths } from '../../utils/time';

export const LIMITS = {
  values: { min: 1, max: 3 },
  goals: { min: 1, max: 3 },
  milestones: { min: 1, max: 10 },
  antiGoals: { min: 1, max: 10 },
  targetCount: { min: 1, max: 500, initial: 24 },
  deadlineMonths: { min: 1, max: 120, initial: 16 },
} as const;

interface GoalSetupDraft {
  values: Value[];
  goals: Goal[];
  action: string;
  workShape: WorkShape | null;
  targetCount: number;
  deadlineMonths: number;
  milestones: Milestone[];
  antiGoals: AntiGoal[];
}

interface GoalSetupActions {
  setValues: (values: Value[]) => void;
  setGoals: (goals: Goal[]) => void;
  setPrimaryGoal: (id: Id) => void;
  setAction: (action: string) => void;
  setWorkShape: (shape: WorkShape) => void;
  setTargetCount: (count: number) => void;
  setDeadlineMonths: (months: number) => void;
  setMilestones: (lines: SheetLine[]) => void;
  setAntiGoals: (antiGoals: AntiGoal[]) => void;
  /** Validated, finished plan — `null` while anything is missing. */
  toPlan: () => GoalPlan | null;
  reset: () => void;
}

const initialDraft: GoalSetupDraft = {
  values: [],
  goals: [],
  action: '',
  workShape: null,
  targetCount: LIMITS.targetCount.initial,
  deadlineMonths: LIMITS.deadlineMonths.initial,
  milestones: [],
  antiGoals: [],
};

/** Milestone due months always follow the deadline and the list order. */
function withDueMonths(
  lines: SheetLine[],
  deadlineMonths: number,
): Milestone[] {
  const months = distributeDueMonths(lines.length, deadlineMonths);
  return lines.map((line, i) => ({
    id: line.id,
    text: line.text,
    dueMonth: months[i],
  }));
}

export const useGoalSetup = create<GoalSetupDraft & GoalSetupActions>()(
  (set, get) => ({
    ...initialDraft,

    setValues: values => set({ values }),

    setGoals: goals => {
      // Keep the primary goal if it survived the edit, otherwise default to
      // the only goal when there is exactly one.
      const hasPrimary = goals.some(g => g.isPrimary);
      const next =
        !hasPrimary && goals.length === 1
          ? [{ ...goals[0], isPrimary: true }]
          : goals;
      set({ goals: next });
    },

    setPrimaryGoal: id =>
      set(state => ({
        goals: state.goals.map(g => ({ ...g, isPrimary: g.id === id })),
      })),

    setAction: action => set({ action }),

    setWorkShape: workShape => set({ workShape }),

    setTargetCount: targetCount => set({ targetCount }),

    setDeadlineMonths: deadlineMonths =>
      set(state => ({
        deadlineMonths,
        milestones: withDueMonths(state.milestones, deadlineMonths),
      })),

    setMilestones: lines =>
      set(state => ({
        milestones: withDueMonths(lines, state.deadlineMonths),
      })),

    setAntiGoals: antiGoals => set({ antiGoals }),

    toPlan: () => {
      const s = get();
      if (!s.workShape || !s.goals.some(g => g.isPrimary)) {
        return null;
      }
      return {
        values: s.values,
        goals: s.goals,
        action: s.action.trim(),
        workShape: s.workShape,
        targetCount: s.workShape === 'repeated' ? s.targetCount : null,
        deadlineMonths: s.deadlineMonths,
        milestones: s.milestones,
        antiGoals: s.antiGoals,
      };
    },

    reset: () => set(initialDraft),
  }),
);

/**
 * For repeated work, suggest milestones that split the target count into
 * even batches, e.g. 24 mock tests → "Mock tests 1–8", "9–16", "17–24".
 */
export function suggestBatchMilestones(
  noun: string,
  total: number,
  batches = 3,
): SheetLine[] {
  const count = Math.min(batches, total);
  const size = Math.ceil(total / count);
  const label = noun.charAt(0).toUpperCase() + noun.slice(1);
  const lines: SheetLine[] = [];
  for (let start = 1; start <= total; start += size) {
    const end = Math.min(total, start + size - 1);
    const range = start === end ? `${start}` : `${start}–${end}`;
    lines.push({ id: createId('milestone'), text: `${label} ${range}` });
  }
  return lines;
}
