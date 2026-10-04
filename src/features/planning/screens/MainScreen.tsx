import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { TabBar, type TabId } from '../../../components/TabBar';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, motion, spacing } from '../../../theme';
import { today } from '../../../utils/clock';
import { addDays } from '../../../utils/date';
import { planFor, usePlanning } from '../store';
import { TasksScreen } from './TasksScreen';
import { TodayScreen } from './TodayScreen';

/**
 * The tabbed home. Tasks (planning) and a simple Today are built; Action
 * Book and Account are designed (Figma 2.02, 2.07) and come next.
 */
export function MainScreen({ navigation, route }: RootScreenProps<'Main'>) {
  const [tab, setTab] = useState<TabId>(route.params?.tab ?? 'today');

  useEffect(() => {
    if (route.params?.tab) {
      setTab(route.params.tab);
    }
  }, [route.params?.tab]);

  const startSession = (slotId: string) => {
    const date = today();
    const session = planFor(usePlanning.getState(), date).sessions.find(
      s => s.slot.id === slotId,
    );
    // No sheet, no session.
    navigation.navigate(session?.sheet ? 'SessionStart' : 'MorningGate', {
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
        {tab === 'today' ? <TodayScreen onStart={startSession} /> : null}
        {tab === 'tasks' ? (
          <TasksScreen
            onPlanTomorrow={() =>
              navigation.navigate('PlanDay', { date: addDays(today(), 1) })
            }
            onSacrifice={() => navigation.navigate('Sacrifice')}
          />
        ) : null}
        {tab === 'book' ? <Upcoming title="Action Book" /> : null}
        {tab === 'account' ? <Upcoming title="Account" /> : null}
      </Animated.View>
      <TabBar active={tab} onChange={setTab} />
    </View>
  );
}

function Upcoming({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.upcoming, { paddingTop: insets.top + spacing.xl }]}>
      <AppText variant="eyebrow">Coming next</AppText>
      <AppText variant="title">{title}</AppText>
      <AppText variant="body" style={styles.muted}>
        Designed and waiting to be built.
      </AppText>
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
  upcoming: {
    flex: 1,
    paddingHorizontal: 22,
    gap: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
});
