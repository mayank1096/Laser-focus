import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TabId } from '../components/TabBar';
import type { Id, ISODate } from '../types/models';

export type RootStackParamList = {
  Welcome: undefined;
  GoalSetup: undefined;
  SetupComplete: undefined;
  /** Session times, shallow window and planning rhythm. */
  WeekSetup: undefined;
  /** The tabbed home of the app. */
  Main: { tab?: TabId } | undefined;
  PlanDay: { date: ISODate };
  SessionSheet: { date: ISODate; slotId: Id };
  SealDay: { date: ISODate };
  Sacrifice: undefined;
  /** Blocks a session that has no sheet until a quick one is written. */
  MorningGate: { date: ISODate; slotId: Id };
  SessionStart: { date: ISODate; slotId: Id };
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
