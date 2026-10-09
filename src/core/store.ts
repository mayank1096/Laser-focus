import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Id, ISODate, SheetLine } from '../types/models';
import { now } from '../utils/clock';
import { createId } from '../utils/id';
import { appDay, weekStart } from './days';
import {
  DEFAULT_RHYTHM,
  type BookData,
  type Goal,
  type Lessons,
  type Mark,
  type Milestone,
  type Rhythm,
  type Session,
  type SetupStep,
  type TaskKind,
  type Term,
  type WeekTask,
} from './model';

interface BookActions {
  setSetup: (step: SetupStep) => void;
  setWelcomed: () => void;
  setValues: (values: SheetLine[]) => void;
  /** Rows of the goals sheet; new rows get a five-year term. */
  setGoals: (lines: SheetLine[]) => void;
  setGoalTerm: (id: Id, term: Term) => void;
  circle: (goalId: Id) => void;
  /** Rows of the circled goal's milestones sheet. */
  setMilestoneLines: (lines: SheetLine[]) => void;
  setMilestoneMonth: (id: Id, month: string | undefined) => void;
  toggleMilestone: (id: Id) => void;
  /** Rows of one week's deep or shallow list. */
  setTaskLines: (week: ISODate, kind: TaskKind, lines: SheetLine[]) => void;
  setTaskMilestone: (id: Id, milestoneId: Id) => void;
  toggleTask: (id: Id) => void;
  carryOver: (id: Id, toWeek: ISODate) => void;
  setRhythm: (patch: Partial<Rhythm>) => void;
  saveSession: (session: Omit<Session, 'id'> & { id?: Id }) => Id;
  deleteSession: (id: Id) => void;
  startSession: (id: Id) => void;
  unstartSession: (id: Id) => void;
  markSession: (
    id: Id,
    mark: Mark,
    extra?: Pick<Session, 'finished' | 'wentWrong'>,
  ) => void;
  /** Leaves only the latest unmarked day to ask about; older ones go empty. */
  settlePending: (today: ISODate) => void;
  saveReview: (week: ISODate, boreSit: boolean) => void;
  finishGoal: () => void;
  rest: (until: ISODate) => void;
  endRest: () => void;
  saveLessons: (repeat: string, dont: string) => void;
  /** Keeps the goal circled with a fresh set of milestones. */
  continueGoal: () => void;
  switchGoal: (goalId: Id) => void;
  setAntiGoals: (lines: SheetLine[]) => void;
  setGiveUp: (lines: SheetLine[]) => void;
  setKeep: (lines: SheetLine[]) => void;
  markReread: (today: ISODate) => void;
  reset: () => void;
}

export type BookState = BookData & { rereadOn: ISODate | null } & BookActions;

const initial: BookData & { rereadOn: ISODate | null } = {
  setup: 'values',
  welcomed: false,
  values: [],
  goals: [],
  circledGoalId: null,
  milestones: [],
  tasks: [],
  rhythm: DEFAULT_RHYTHM,
  sessions: [],
  reviews: [],
  restUntil: null,
  reassessing: false,
  lessons: [],
  antiGoals: [],
  giveUp: [],
  keep: [],
  sprintStart: null,
  rereadOn: null,
};

const stamp = () => now().toISOString();

export const useBook = create<BookState>()(
  persist(
    set => ({
      ...initial,

      setSetup: setup => set({ setup }),
      setWelcomed: () => set({ welcomed: true }),
      setValues: values => set({ values }),

      setGoals: lines =>
        set(s => {
          const goals: Goal[] = lines.map(l => {
            const old = s.goals.find(g => g.id === l.id);
            return old
              ? { ...old, text: l.text }
              : { id: l.id, text: l.text, term: 5 };
          });
          const circledGoalId = goals.some(g => g.id === s.circledGoalId)
            ? s.circledGoalId
            : null;
          return { goals, circledGoalId };
        }),
      setGoalTerm: (id, term) =>
        set(s => ({
          goals: s.goals.map(g => (g.id === id ? { ...g, term } : g)),
        })),
      circle: goalId =>
        set(s => ({
          circledGoalId: goalId,
          sprintStart:
            s.circledGoalId === goalId && s.sprintStart
              ? s.sprintStart
              : appDay(),
        })),

      setMilestoneLines: lines =>
        set(s => {
          const goalId = s.circledGoalId;
          if (!goalId) {
            return {};
          }
          const others = s.milestones.filter(
            m => m.goalId !== goalId || m.archived,
          );
          const mine: Milestone[] = lines.map(l => {
            const old = s.milestones.find(m => m.id === l.id);
            return old
              ? { ...old, text: l.text }
              : { id: l.id, goalId, text: l.text, done: false };
          });
          return { milestones: [...others, ...mine] };
        }),
      setMilestoneMonth: (id, month) =>
        set(s => ({
          milestones: s.milestones.map(m =>
            m.id === id ? { ...m, month } : m,
          ),
        })),
      toggleMilestone: id =>
        set(s => ({
          milestones: s.milestones.map(m =>
            m.id === id ? { ...m, done: !m.done } : m,
          ),
        })),

      setTaskLines: (week, kind, lines) =>
        set(s => {
          const others = s.tasks.filter(
            t => t.week !== week || t.kind !== kind,
          );
          const firstOpen = s.milestones.find(
            m => m.goalId === s.circledGoalId && !m.archived && !m.done,
          );
          const mine: WeekTask[] = lines.map(l => {
            const old = s.tasks.find(t => t.id === l.id);
            return old
              ? { ...old, text: l.text }
              : {
                  id: l.id,
                  text: l.text,
                  kind,
                  week,
                  done: false,
                  milestoneId: kind === 'deep' ? firstOpen?.id : undefined,
                };
          });
          return { tasks: [...others, ...mine] };
        }),
      setTaskMilestone: (id, milestoneId) =>
        set(s => ({
          tasks: s.tasks.map(t => (t.id === id ? { ...t, milestoneId } : t)),
        })),
      toggleTask: id =>
        set(s => ({
          tasks: s.tasks.map(t => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      carryOver: (id, toWeek) =>
        set(s => {
          const t = s.tasks.find(x => x.id === id);
          if (!t || s.tasks.some(x => x.week === toWeek && x.text === t.text)) {
            return {};
          }
          return {
            tasks: [
              ...s.tasks,
              { ...t, id: createId('task'), week: toWeek, done: false },
            ],
          };
        }),

      setRhythm: patch => set(s => ({ rhythm: { ...s.rhythm, ...patch } })),

      saveSession: session => {
        const id = session.id ?? createId('session');
        set(s => {
          const rest = s.sessions.filter(x => x.id !== id);
          return { sessions: [...rest, { ...session, id }] };
        });
        return id;
      },
      deleteSession: id =>
        set(s => {
          const gone = s.sessions.find(x => x.id === id);
          const sessions = s.sessions
            .filter(x => x.id !== id)
            .map(x =>
              gone && x.date === gone.date && x.order > gone.order
                ? { ...x, order: x.order - 1 }
                : x,
            );
          return { sessions };
        }),
      startSession: id =>
        set(s => ({
          sessions: s.sessions.map(x =>
            x.id === id ? { ...x, startedAt: stamp() } : x,
          ),
        })),
      unstartSession: id =>
        set(s => ({
          sessions: s.sessions.map(x =>
            x.id === id ? { ...x, startedAt: undefined } : x,
          ),
        })),
      markSession: (id, mark, extra) =>
        set(s => ({
          sessions: s.sessions.map(x =>
            x.id === id ? { ...x, ...extra, mark, markedAt: stamp() } : x,
          ),
        })),
      settlePending: today =>
        set(s => {
          const pending = s.sessions.filter(x => x.date < today && !x.mark);
          if (!pending.length) {
            return {};
          }
          const latest = pending
            .map(x => x.date)
            .sort()
            .pop();
          if (!pending.some(x => x.date < (latest as string))) {
            return {};
          }
          return {
            sessions: s.sessions.map(x =>
              x.date < (latest as string) && !x.mark
                ? { ...x, mark: 'empty' as Mark, markedAt: stamp() }
                : x,
            ),
          };
        }),

      saveReview: (week, boreSit) =>
        set(s => ({
          reviews: [
            ...s.reviews.filter(r => r.week !== week),
            { week, boreSit, at: stamp() },
          ],
        })),
      finishGoal: () =>
        set(s => ({
          goals: s.goals.map(g =>
            g.id === s.circledGoalId ? { ...g, doneAt: stamp() } : g,
          ),
        })),
      rest: until => set({ restUntil: until, reassessing: true }),
      endRest: () => set({ restUntil: null, reassessing: true }),
      saveLessons: (repeat, dont) =>
        set(s => ({
          lessons: [...s.lessons, { repeat, dont, at: stamp() } as Lessons],
        })),
      continueGoal: () =>
        set(s => ({
          goals: s.goals.map(g =>
            g.id === s.circledGoalId ? { ...g, doneAt: undefined } : g,
          ),
          milestones: s.milestones.map(m =>
            m.goalId === s.circledGoalId ? { ...m, archived: true } : m,
          ),
          sprintStart: appDay(),
        })),
      switchGoal: goalId =>
        set(s => ({
          milestones: s.milestones.map(m =>
            m.goalId === s.circledGoalId ? { ...m, archived: true } : m,
          ),
          circledGoalId: goalId,
          sprintStart: appDay(),
        })),
      setAntiGoals: antiGoals => set({ antiGoals }),
      setGiveUp: giveUp => set({ giveUp }),
      setKeep: keep => set({ keep }),
      markReread: today => set({ rereadOn: today }),
      reset: () => set(initial),
    }),
    {
      name: 'laser-focus/book',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({
        setup,
        welcomed,
        values,
        goals,
        circledGoalId,
        milestones,
        tasks,
        rhythm,
        sessions,
        reviews,
        restUntil,
        reassessing,
        lessons,
        antiGoals,
        giveUp,
        keep,
        sprintStart,
        rereadOn,
      }) => ({
        setup,
        welcomed,
        values,
        goals,
        circledGoalId,
        milestones,
        tasks,
        rhythm,
        sessions,
        reviews,
        restUntil,
        reassessing,
        lessons,
        antiGoals,
        giveUp,
        keep,
        sprintStart,
        rereadOn,
      }),
    },
  ),
);

/** The circled goal, if any. */
export const circledGoal = (s: Pick<BookData, 'goals' | 'circledGoalId'>) =>
  s.goals.find(g => g.id === s.circledGoalId) ?? null;

/** Tasks for the week containing `date`. */
export const tasksForWeek = (
  s: Pick<BookData, 'tasks' | 'rhythm'>,
  date: ISODate,
  kind?: TaskKind,
) =>
  s.tasks.filter(
    t =>
      t.week === weekStart(date, s.rhythm.reviewDay) &&
      (!kind || t.kind === kind),
  );

/** Leaving reassess once the next goal's first plan is saved. */
export const finishReassess = () =>
  useBook.setState({ reassessing: false, restUntil: null });

/** Read-only snapshot for non-React code. */
export const book = () => useBook.getState();

/** The last-used don't-do list, to pre-fill the next plan. */
export function lastDontDo(sessions: Session[]): string[] {
  const withList = sessions
    .filter(s => s.dontDo?.length)
    .sort((a, b) =>
      a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1,
    );
  return withList[0]?.dontDo ?? [];
}

/** The most recent "What did you finish?", for tomorrow's challenge line. */
export function lastFinished(sessions: Session[]): string | null {
  const done = sessions
    .filter(s => s.mark === 'full' && s.finished)
    .sort((a, b) =>
      a.date === b.date ? b.order - a.order : a.date < b.date ? 1 : -1,
    );
  return done[0]?.finished ?? null;
}
