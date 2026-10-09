import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OrbSplash } from '../components/OrbOverlay';
import { useBook } from '../core/store';
import { useProfile } from '../features/account/store';
import { BookScreen } from '../flow/book/BookScreen';
import { BookSheetScreen } from '../flow/book/BookSheetScreen';
import { SettingsScreen } from '../flow/book/SettingsScreen';
import { DayDoneScreen } from '../flow/loop/DayDoneScreen';
import { MainScreen } from '../flow/main/MainScreen';
import { EndEarlyScreen } from '../flow/loop/EndEarlyScreen';
import { InProgressScreen } from '../flow/loop/InProgressScreen';
import { MarkScreen } from '../flow/loop/MarkScreen';
import { PlanScreen } from '../flow/loop/PlanScreen';
import { StartScreen } from '../flow/loop/StartScreen';
import { ContactScreen } from '../flow/setup/ContactScreen';
import { SetupDoneScreen } from '../flow/setup/SetupDoneScreen';
import { SetupScreen } from '../flow/setup/SetupScreen';
import { SignInScreen } from '../flow/setup/SignInScreen';
import { WelcomeScreen } from '../flow/setup/WelcomeScreen';
import { GoalDoneScreen } from '../flow/sprint/GoalDoneScreen';
import { ReassessScreen } from '../flow/sprint/ReassessScreen';
import { RestScreen } from '../flow/sprint/RestScreen';
import { ReviewScreen } from '../flow/sprint/ReviewScreen';
import { ClearFieldScreen } from '../flow/vow/ClearFieldScreen';
import { DayOneScreen } from '../flow/vow/DayOneScreen';
import { LockoutScreen } from '../flow/vow/LockoutScreen';
import { PermissionsScreen } from '../flow/vow/PermissionsScreen';
import { PratigyaScreen } from '../flow/vow/PratigyaScreen';
import { TakeVowScreen } from '../flow/vow/TakeVowScreen';
import { VowAsksScreen } from '../flow/vow/VowAsksScreen';
import { reminders } from '../services/reminders';
import { resumeRoute } from './resume';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => () => void;
  };
};
const STORES: PersistedStore[] = [useBook, useProfile];

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

const noSwipe = { gestureEnabled: false };

export function RootNavigator() {
  const hydrated = useHydrated();
  // Keep the one evening reminder in step with the rhythm.
  const rhythm = useBook(s => s.rhythm);
  useEffect(() => {
    if (hydrated) {
      reminders.schedule(rhythm);
    }
  }, [hydrated, rhythm]);
  if (!hydrated) {
    // Reading saved progress usually takes milliseconds; a slow phone sees
    // the orb rather than a blank screen.
    return <OrbSplash />;
  }
  const first = resumeRoute();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={first.name}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        {/* Back is handled sheet by sheet inside setup. */}
        <Stack.Screen
          name="Setup"
          component={SetupScreen}
          options={noSwipe}
          initialParams={first.name === 'Setup' ? first.params : undefined}
        />
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
          name="SetupDone"
          component={SetupDoneScreen}
          options={noSwipe}
        />
        <Stack.Screen
          name="Lockout"
          component={LockoutScreen}
          options={noSwipe}
        />
        <Stack.Screen name="Home" component={MainScreen} />
        <Stack.Group screenOptions={{ animation: 'slide_from_right' }}>
          <Stack.Screen
            name="Plan"
            component={PlanScreen}
            initialParams={first.name === 'Plan' ? first.params : undefined}
          />
          <Stack.Screen name="Start" component={StartScreen} />
          <Stack.Screen name="Review" component={ReviewScreen} />
          <Stack.Screen name="Reassess" component={ReassessScreen} />
          <Stack.Screen name="Book" component={BookScreen} />
          <Stack.Screen name="BookSheet" component={BookSheetScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Group>
        <Stack.Group
          screenOptions={{ animation: 'fade', gestureEnabled: false }}
        >
          <Stack.Screen
            name="InProgress"
            component={InProgressScreen}
            initialParams={
              first.name === 'InProgress' ? first.params : undefined
            }
          />
          <Stack.Screen name="EndEarly" component={EndEarlyScreen} />
          <Stack.Screen name="Mark" component={MarkScreen} />
          <Stack.Screen name="DayDone" component={DayDoneScreen} />
          <Stack.Screen name="GoalDone" component={GoalDoneScreen} />
          <Stack.Screen name="Rest" component={RestScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
