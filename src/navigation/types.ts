import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  GoalSetup: undefined;
  SetupComplete: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
