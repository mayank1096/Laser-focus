import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TabId } from '../components/TabBar';
import type { Id, ISODate } from '../types/models';

export type AuthMode = 'signup' | 'signin';

export type RootStackParamList = {
  // Start
  Welcome: undefined;
  Language: undefined;
  Name: undefined;
  GoalSetup: undefined;
  // Account
  SaveSheets: undefined;
  Phone: { mode: AuthMode };
  Code: { mode: AuthMode; phone: string };
  WelcomeBack: undefined;
  // Path & Pratigya
  Path: undefined;
  Pratigya: undefined;
  VowAsks: undefined;
  Permissions: undefined;
  ClearField: undefined;
  TakeVow: undefined;
  DayOne: undefined;
  Lockout: undefined;
  // Planning
  WeekSetup: undefined;
  /** The tabbed home of the app. */
  Main: { tab?: TabId } | undefined;
  PlanDay: { date: ISODate };
  SessionSheet: { date: ISODate; slotId: Id };
  SealDay: { date: ISODate };
  Sacrifice: undefined;
  /** Blocks a session that has no sheet until a quick one is written. */
  MorningGate: { date: ISODate; slotId: Id };
  // Action Book
  ValuesSheet: undefined;
  GoalsSheet: undefined;
  MilestonesSheet: undefined;
  AntiGoalsSheet: undefined;
  SwitchGoal: undefined;
  PlanNextGoal: undefined;
  // Session
  Ritual: { date: ISODate; slotId: Id };
  InSession: undefined;
  EmergencyEnd: undefined;
  SessionDone: { date: ISODate; slotId: Id };
  ProblemFinder: { date: ISODate; slotId: Id };
  Fix: { date: ISODate; slotId: Id; reason: string };
  StreakMark: { date: ISODate };
  Rest: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
