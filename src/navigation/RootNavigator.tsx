import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalSetupScreen } from '../features/onboarding/screens/GoalSetupScreen';
import { SetupCompleteScreen } from '../features/onboarding/screens/SetupCompleteScreen';
import { WelcomeScreen } from '../features/onboarding/screens/WelcomeScreen';
import { useGoalSetup } from '../features/onboarding/store';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** True once saved progress has been read from the device. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useGoalSetup.persist.hasHydrated(),
  );
  useEffect(() => {
    if (hydrated) {
      return;
    }
    return useGoalSetup.persist.onFinishHydration(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}

export function RootNavigator() {
  const hydrated = useHydrated();
  if (!hydrated) {
    // Reading saved progress takes a few milliseconds; the splash covers it.
    return null;
  }

  const { completed, stepId } = useGoalSetup.getState();
  const initialRouteName: keyof RootStackParamList = completed
    ? 'SetupComplete'
    : stepId
    ? 'GoalSetup'
    : 'Welcome';

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
