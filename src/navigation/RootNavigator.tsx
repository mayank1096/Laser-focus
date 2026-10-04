import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalSetupScreen } from '../features/onboarding/screens/GoalSetupScreen';
import { SetupCompleteScreen } from '../features/onboarding/screens/SetupCompleteScreen';
import { WelcomeScreen } from '../features/onboarding/screens/WelcomeScreen';
import { useGoalSetup } from '../features/onboarding/store';
import { MainScreen } from '../features/planning/screens/MainScreen';
import { MorningGateScreen } from '../features/planning/screens/MorningGateScreen';
import { PlanDayScreen } from '../features/planning/screens/PlanDayScreen';
import { SacrificeScreen } from '../features/planning/screens/SacrificeScreen';
import { SealDayScreen } from '../features/planning/screens/SealDayScreen';
import { SessionStartScreen } from '../features/planning/screens/SessionStartScreen';
import { WeekSetupScreen } from '../features/planning/setup/WeekSetupScreen';
import { SessionSheetScreen } from '../features/planning/sheet/SessionSheetScreen';
import { usePlanning } from '../features/planning/store';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};
const STORES: PersistedStore[] = [useGoalSetup, usePlanning];

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
export function initialRoute(): keyof RootStackParamList {
  const { completed, stepId } = useGoalSetup.getState();
  if (completed) {
    return usePlanning.getState().setupDone ? 'Main' : 'SetupComplete';
  }
  return stepId ? 'GoalSetup' : 'Welcome';
}

export function RootNavigator() {
  const hydrated = useHydrated();
  if (!hydrated) {
    // Reading saved progress takes a few milliseconds; the splash covers it.
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute()}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen
          name="GoalSetup"
          component={GoalSetupScreen}
          // Back is handled step-by-step inside the flow.
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="SetupComplete" component={SetupCompleteScreen} />
        <Stack.Screen
          name="WeekSetup"
          component={WeekSetupScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
          <Stack.Screen name="PlanDay" component={PlanDayScreen} />
          <Stack.Screen
            name="SessionSheet"
            component={SessionSheetScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="SealDay" component={SealDayScreen} />
          <Stack.Screen
            name="Sacrifice"
            component={SacrificeScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="MorningGate" component={MorningGateScreen} />
          <Stack.Screen name="SessionStart" component={SessionStartScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
