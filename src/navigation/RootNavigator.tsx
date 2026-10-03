import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GoalSetupScreen } from '../features/onboarding/screens/GoalSetupScreen';
import { SetupCompleteScreen } from '../features/onboarding/screens/SetupCompleteScreen';
import { WelcomeScreen } from '../features/onboarding/screens/WelcomeScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
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
