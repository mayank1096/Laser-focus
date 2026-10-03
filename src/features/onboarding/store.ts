import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
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
import { addMonths, distributeDueMonths } from '../../utils/time';

export const LIMITS = {
  // "Three lines" on the Values screen means exactly three.
  values: { min: 3, max: 3 },
  goals: { min: 1, max: 3 },
  milestones: { min: 1, max: 10 },
  // The course asks for ten regrets; three is the floor to move on.
  antiGoals: { min: 3, max: 10 },
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
  /** The question the user was on, so a closed app resumes in place. */
  stepId: string | null;
  completed: boolean;
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
  /** Moves a milestone's month on by one, wrapping back after the deadline. */
  cycleMilestoneMonth: (id: Id) => void;
  setAntiGoals: (antiGoals: AntiGoal[]) => void;
  setStep: (stepId: string) => void;
  complete: () => void;
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
  stepId: null,
  completed: false,
};

/**
 * Dates milestones evenly up to the deadline, in list order. Months the user
 * picked by hand are kept.
 */
function withDueMonths(
  lines: SheetLine[],
  previous: Milestone[],
  deadlineMonths: number,
): Milestone[] {
  const months = distributeDueMonths(lines.length, deadlineMonths);
  return lines.map((line, i) => {
    const before = previous.find(m => m.id === line.id);
    return before?.monthPinned
      ? { ...before, text: line.text }
      : { id: line.id, text: line.text, dueMonth: months[i] };
  });
}

export const useGoalSetup = create<GoalSetupDraft & GoalSetupActions>()(
  persist(
    (set, get) => ({
      ...initialDraft,

      setValues: values => set({ values }),

      setGoals: goals => {
        // Keep the primary goal if it survived the edit; a single goal is
        // always the primary one.
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
          milestones: withDueMonths(
            state.milestones,
            state.milestones,
            deadlineMonths,
          ),
        })),

      setMilestones: lines =>
        set(state => ({
          milestones: withDueMonths(
            lines,
            state.milestones,
            state.deadlineMonths,
          ),
        })),

      cycleMilestoneMonth: id =>
        set(state => {
          const now = new Date();
          const options = Array.from({ length: state.deadlineMonths }, (_, i) =>
            addMonths(now, i + 1),
          );
          return {
            milestones: state.milestones.map(m => {
              if (m.id !== id) {
                return m;
              }
              const at = options.indexOf(m.dueMonth);
              const next = options[(at + 1) % options.length];
              return { ...m, dueMonth: next, monthPinned: true };
            }),
          };
        }),

      setAntiGoals: antiGoals => set({ antiGoals }),

      setStep: stepId => set({ stepId }),

      complete: () => set({ completed: true }),

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
    {
      name: 'laser-focus/goal-setup',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Persist the answers and position, never the functions.
      partialize: ({
        values,
        goals,
        action,
        workShape,
        targetCount,
        deadlineMonths,
        milestones,
        antiGoals,
        stepId,
        completed,
      }) => ({
        values,
        goals,
        action,
        workShape,
        targetCount,
        deadlineMonths,
        milestones,
        antiGoals,
        stepId,
        completed,
      }),
    },
  ),
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
