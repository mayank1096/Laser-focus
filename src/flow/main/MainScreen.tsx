import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { TabBar, type TabId } from '../../components/TabBar';
import { useProfile } from '../../features/account/store';
import type {
  RootScreenProps,
  RootStackParamList,
} from '../../navigation/types';
import { colors, motion } from '../../theme';
import { AccountTab } from './AccountTab';
import { BookTab } from './BookTab';
import { TasksTab } from './TasksTab';
import { TodayTab } from './TodayTab';

/** The four tabs: Today, Action Book, Tasks, Account. */
export function MainScreen({ navigation, route }: RootScreenProps<'Home'>) {
  const [tab, setTab] = useState<TabId>(route.params?.tab ?? 'today');

  useEffect(() => {
    if (route.params?.tab) {
      setTab(route.params.tab);
    }
  }, [route.params?.tab]);

  const go = <K extends keyof RootStackParamList>(
    name: K,
    params?: RootStackParamList[K],
  ) =>
    (navigation.navigate as (n: K, p?: RootStackParamList[K]) => void)(
      name,
      params,
    );

  return (
    <View style={styles.screen}>
      <Animated.View
        key={tab}
        entering={FadeIn.duration(motion.fast)}
        style={styles.fill}
      >
        {tab === 'today' ? <TodayTab go={go} /> : null}
        {tab === 'book' ? (
          <BookTab
            onOpen={to => {
              if (to === 'tasks') {
                setTab('tasks');
              } else if (to === 'sessions') {
                go('Book');
              } else {
                go('BookSheet', { sheet: to });
              }
            }}
          />
        ) : null}
        {tab === 'tasks' ? (
          <TasksTab
            onPlan={date => go('Plan', { date })}
            onReview={week => go('Review', { week })}
            onEdit={() => go('BookSheet', { sheet: 'week' })}
          />
        ) : null}
        {tab === 'account' ? (
          <AccountTab
            onOpen={to => {
              switch (to) {
                case 'values':
                  return go('BookSheet', { sheet: 'values' });
                case 'antiGoal':
                  return go('BookSheet', { sheet: 'antiGoal' });
                case 'pratigya':
                  return go('BookSheet', { sheet: 'vow' });
                case 'settings':
                  return go('Settings');
                case 'signOut':
                  useProfile.setState({ account: null });
                  return navigation.reset({
                    index: 0,
                    routes: [{ name: 'SignIn' }],
                  });
              }
            }}
          />
        ) : null}
      </Animated.View>
      <TabBar active={tab} onChange={setTab} />
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
