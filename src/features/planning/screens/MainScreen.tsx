import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { TabBar, type TabId } from '../../../components/TabBar';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, motion } from '../../../theme';
import { today } from '../../../utils/clock';
import { addDays } from '../../../utils/date';
import { AccountScreen } from '../../account/screens/AccountScreen';
import { useProfile } from '../../account/store';
import { ActionBookScreen } from '../../book/ActionBookScreen';
import { TodayScreen } from '../../home/TodayScreen';
import { useGoalSetup } from '../../onboarding/store';
import { useSessions } from '../../session/store';
import { planFor, usePlanning } from '../store';
import { TasksScreen } from './TasksScreen';

const SURFACE: Record<TabId, string> = {
  today: colors.parchment,
  book: colors.parchment,
  tasks: colors.parchment,
  account: colors.white,
};

/** The four tabs: Today, Action Book, Tasks, Account. */
export function MainScreen({ navigation, route }: RootScreenProps<'Main'>) {
  const [tab, setTab] = useState<TabId>(route.params?.tab ?? 'today');

  useEffect(() => {
    if (route.params?.tab) {
      setTab(route.params.tab);
    }
  }, [route.params?.tab]);

  const begin = (slotId: string) => {
    const date = today();
    const session = planFor(usePlanning.getState(), date).sessions.find(
      s => s.slot.id === slotId,
    );
    // No sheet, no session.
    navigation.navigate(session?.sheet ? 'Ritual' : 'MorningGate', {
      date,
      slotId,
    });
  };

  return (
    <View style={styles.screen}>
      <Animated.View
        key={tab}
        entering={FadeIn.duration(motion.fast)}
        style={styles.fill}
      >
        {tab === 'today' ? (
          <TodayScreen
            onBegin={begin}
            onPlanToday={() => {
              const day = planFor(usePlanning.getState(), today());
              navigation.navigate('PlanDay', {
                date: day.sessions.some(s => s.task)
                  ? addDays(today(), 1)
                  : today(),
              });
            }}
          />
        ) : null}
        {tab === 'book' ? (
          <ActionBookScreen
            onOpen={sheet => {
              switch (sheet) {
                case 'values':
                  return navigation.navigate('ValuesSheet');
                case 'goals':
                  return navigation.navigate('GoalsSheet');
                case 'milestones':
                  return navigation.navigate('MilestonesSheet');
                case 'antiGoals':
                  return navigation.navigate('AntiGoalsSheet');
                case 'tasks':
                  return setTab('tasks');
                case 'sessions':
                  return navigation.navigate('PlanDay', {
                    date: addDays(today(), 1),
                  });
                case 'sacrifice':
                  return navigation.navigate('Sacrifice');
              }
            }}
          />
        ) : null}
        {tab === 'tasks' ? (
          <TasksScreen
            onPlanTomorrow={() =>
              navigation.navigate('PlanDay', { date: addDays(today(), 1) })
            }
            onSacrifice={() => navigation.navigate('Sacrifice')}
          />
        ) : null}
        {tab === 'account' ? (
          <AccountScreen
            onOpen={to => {
              switch (to) {
                case 'values':
                  return navigation.navigate('ValuesSheet');
                case 'antiGoals':
                  return navigation.navigate('AntiGoalsSheet');
                case 'pratigya':
                  return navigation.navigate('VowAsks');
                case 'signOut':
                  useProfile.getState().reset();
                  useGoalSetup.getState().reset();
                  usePlanning.getState().reset();
                  useSessions.getState().reset();
                  return navigation.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                  });
              }
            }}
          />
        ) : null}
      </Animated.View>
      <TabBar active={tab} onChange={setTab} surface={SURFACE[tab]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.parchment,
  },
  fill: {
    flex: 1,
  },
});
