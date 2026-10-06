import { OrbSplash } from '../components/OrbOverlay';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CodeScreen } from '../features/account/screens/CodeScreen';
import { LanguageScreen } from '../features/account/screens/LanguageScreen';
import { NameScreen } from '../features/account/screens/NameScreen';
import { PhoneScreen } from '../features/account/screens/PhoneScreen';
import { SaveSheetsScreen } from '../features/account/screens/SaveSheetsScreen';
import { WelcomeBackScreen } from '../features/account/screens/WelcomeBackScreen';
import { useProfile } from '../features/account/store';
import { AntiGoalsSheetScreen } from '../features/book/AntiGoalsSheetScreen';
import { GoalsSheetScreen } from '../features/book/GoalsSheetScreen';
import { MilestonesSheetScreen } from '../features/book/MilestonesSheetScreen';
import { PlanNextGoalScreen } from '../features/book/PlanNextGoalScreen';
import { SwitchGoalScreen } from '../features/book/SwitchGoalScreen';
import { ValuesSheetScreen } from '../features/book/ValuesSheetScreen';
import { GoalSetupScreen } from '../features/onboarding/screens/GoalSetupScreen';
import { WelcomeScreen } from '../features/onboarding/screens/WelcomeScreen';
import { useGoalSetup } from '../features/onboarding/store';
import { MainScreen } from '../features/planning/screens/MainScreen';
import { MorningGateScreen } from '../features/planning/screens/MorningGateScreen';
import { PlanDayScreen } from '../features/planning/screens/PlanDayScreen';
import { SacrificeScreen } from '../features/planning/screens/SacrificeScreen';
import { SealDayScreen } from '../features/planning/screens/SealDayScreen';
import { WeekSetupScreen } from '../features/planning/setup/WeekSetupScreen';
import { SessionSheetScreen } from '../features/planning/sheet/SessionSheetScreen';
import { usePlanning } from '../features/planning/store';
import { ClearFieldScreen } from '../features/pratigya/ClearFieldScreen';
import { DayOneScreen } from '../features/pratigya/DayOneScreen';
import { LockoutScreen } from '../features/pratigya/LockoutScreen';
import { PathScreen } from '../features/pratigya/PathScreen';
import { PermissionsScreen } from '../features/pratigya/PermissionsScreen';
import { PratigyaScreen } from '../features/pratigya/PratigyaScreen';
import { TakeVowScreen } from '../features/pratigya/TakeVowScreen';
import { VowAsksScreen } from '../features/pratigya/VowAsksScreen';
import { EmergencyEndScreen } from '../features/session/EmergencyEndScreen';
import { FixScreen } from '../features/session/FixScreen';
import { InSessionScreen } from '../features/session/InSessionScreen';
import { ProblemFinderScreen } from '../features/session/ProblemFinderScreen';
import { RestScreen } from '../features/session/RestScreen';
import { RitualScreen } from '../features/session/ritual/RitualScreen';
import { SessionDoneScreen } from '../features/session/SessionDoneScreen';
import { useSessions } from '../features/session/store';
import { StreakMarkScreen } from '../features/session/StreakMarkScreen';
import { resumeRoute } from './resume';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};
const STORES: PersistedStore[] = [
  useGoalSetup,
  usePlanning,
  useProfile,
  useSessions,
];

/** True once every saved store has been read from the device. */
function useHydrated() {
  const all = () => STORES.every(s => s.persist.hasHydrated());
  const [hydrated, setHydrated] = useState(all);
  useEffect(() => {
    if (hydrated) {
      return;
    }
    const subs = STORES.map(s =>
      s.persist.onFinishHydration(() => setHydrated(all())),
    );
    // A store may have finished between the first render and now.
    setHydrated(all());
    return () => subs.forEach(unsub => unsub());
  }, [hydrated]);
  return hydrated;
}

/** Where a returning user lands, from what they have finished. */
export const initialRoute = resumeRoute;

const noSwipe = { gestureEnabled: false };

export function RootNavigator() {
  const hydrated = useHydrated();
  if (!hydrated) {
    // Reading saved progress usually takes milliseconds; a slow phone sees
    // the orb rather than a blank screen.
    return <OrbSplash />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={resumeRoute()}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="Name" component={NameScreen} />
        {/* Back is handled step by step inside these flows. */}
        <Stack.Screen
          name="GoalSetup"
          component={GoalSetupScreen}
          options={noSwipe}
        />
        <Stack.Screen name="SaveSheets" component={SaveSheetsScreen} />
        <Stack.Screen name="Phone" component={PhoneScreen} />
        <Stack.Screen name="Code" component={CodeScreen} />
        <Stack.Screen name="WelcomeBack" component={WelcomeBackScreen} />
        <Stack.Screen name="Path" component={PathScreen} />
        <Stack.Screen name="Pratigya" component={PratigyaScreen} />
        <Stack.Screen name="VowAsks" component={VowAsksScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="ClearField" component={ClearFieldScreen} />
        <Stack.Screen name="TakeVow" component={TakeVowScreen} />
        <Stack.Screen
          name="DayOne"
          component={DayOneScreen}
          options={noSwipe}
        />
        <Stack.Screen
          name="Lockout"
          component={LockoutScreen}
          options={noSwipe}
        />
        <Stack.Screen
          name="WeekSetup"
          component={WeekSetupScreen}
          options={noSwipe}
        />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
          <Stack.Screen name="PlanDay" component={PlanDayScreen} />
          <Stack.Screen
            name="SessionSheet"
            component={SessionSheetScreen}
            options={noSwipe}
          />
          <Stack.Screen name="SealDay" component={SealDayScreen} />
          <Stack.Screen
            name="Sacrifice"
            component={SacrificeScreen}
            options={noSwipe}
          />
          <Stack.Screen name="MorningGate" component={MorningGateScreen} />
          <Stack.Screen name="ValuesSheet" component={ValuesSheetScreen} />
          <Stack.Screen name="GoalsSheet" component={GoalsSheetScreen} />
          <Stack.Screen
            name="MilestonesSheet"
            component={MilestonesSheetScreen}
          />
          <Stack.Screen
            name="AntiGoalsSheet"
            component={AntiGoalsSheetScreen}
          />
          <Stack.Screen
            name="SwitchGoal"
            component={SwitchGoalScreen}
            options={noSwipe}
          />
        </Stack.Group>
        <Stack.Screen
          name="PlanNextGoal"
          component={PlanNextGoalScreen}
          options={noSwipe}
        />
        <Stack.Group
          screenOptions={{ animation: 'fade', gestureEnabled: false }}
        >
          <Stack.Screen name="Ritual" component={RitualScreen} />
          <Stack.Screen name="InSession" component={InSessionScreen} />
          <Stack.Screen name="EmergencyEnd" component={EmergencyEndScreen} />
          <Stack.Screen name="SessionDone" component={SessionDoneScreen} />
          <Stack.Screen name="ProblemFinder" component={ProblemFinderScreen} />
          <Stack.Screen name="Fix" component={FixScreen} />
          <Stack.Screen name="StreakMark" component={StreakMarkScreen} />
          <Stack.Screen name="Rest" component={RestScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
