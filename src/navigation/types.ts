import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TabId } from '../components/TabBar';
import type { SetupStep } from '../core/model';
import type { Id, ISODate } from '../types/models';

export type BookSheet =
  | 'values'
  | 'goals'
  | 'milestones'
  | 'week'
  | 'antiGoal'
  | 'sacrifice'
  | 'vow';

export type RootStackParamList = {
  // Part 1 · Set up
  SignIn: undefined;
  Welcome: undefined;
  Setup: { step?: SetupStep; returnTo?: 'reassess' | 'reread' } | undefined;
  Pratigya: undefined;
  VowAsks: undefined;
  Permissions: undefined;
  ClearField: undefined;
  TakeVow: undefined;
  SetupDone: undefined;
  DayOne: undefined;
  Lockout: undefined;
  // Part 2 · The daily loop
  Home: { tab?: TabId } | undefined;
  Plan: { date?: ISODate; first?: boolean } | undefined;
  Start: { id: Id };
  InProgress: { id: Id };
  EndEarly: { id: Id };
  Mark: { id: Id };
  DayDone: { date: ISODate };
  // Part 3 · Weekly and sprint
  Review: { week: ISODate };
  GoalDone: undefined;
  Rest: undefined;
  Reassess: undefined;
  // Part 4 · Second level
  Book: undefined;
  BookSheet: { sheet: BookSheet };
  Settings: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
