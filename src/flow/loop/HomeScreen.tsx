import React, { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Settings from '../../assets/icons/settings.svg';
import { AppText } from '../../components/AppText';
import { AuroraSky } from '../../components/aurora';
import { PrimaryButton } from '../../components/PrimaryButton';
import { appDay, appMinutes, lastSeven } from '../../core/days';
import { dayMark, homeAction, type HomeAction } from '../../core/home';
import { circledGoal, useBook } from '../../core/store';
import { useT, type Strings } from '../../i18n';
import { dayDate, shortDate } from '../../i18n/format';
import type {
  RootScreenProps,
  RootStackParamList,
} from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { addDays } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { WeekRow } from '../components/MarkBox';

type Nav = RootScreenProps<'Home'>['navigation'];

const SKY = 330;

/**
 * Home is one button: the next step of the loop, computed from state. Above
 * it the last seven days; below it the Action Book. Nothing else.
 */
export function HomeScreen({ navigation }: RootScreenProps<'Home'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const state = useBook();
  const today = appDay();
  const action = homeAction(state, today, appMinutes());
  const days = lastSeven(today);
  const goal = circledGoal(state);

  // A user back after days away is asked about the latest day only.
  useEffect(() => {
    useBook.getState().settlePending(today);
  }, [today]);

  const { label, go, disabled, extra } = describe(action, t, today, navigation);

  return (
    <View style={styles.screen} testID="home">
      <AuroraSky width={width} height={SKY + insets.top} style={styles.sky} />
      <View style={[styles.top, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.bar}>
          <AppText variant="eyebrow" style={styles.light}>
            {t.home.lastSeven}
          </AppText>
          <Pressable
            testID="settings"
            accessibilityRole="button"
            accessibilityLabel={t.settings.title}
            hitSlop={12}
            onPress={() => navigation.navigate('Settings')}
          >
            <Settings width={22} height={22} color={colors.white} />
          </Pressable>
        </View>
        <Pressable
          testID="home-week"
          accessibilityRole="button"
          accessibilityLabel={t.book.calendar}
          onPress={() => navigation.navigate('Book')}
          style={styles.week}
        >
          <WeekRow
            days={days}
            marks={days.map(d => dayMark(state, d))}
            today={today}
            letters={t.common.dayLetter}
          />
        </Pressable>
        {goal ? (
          <Animated.Text
            entering={FadeIn.duration(motion.slow)}
            style={styles.goal}
            numberOfLines={2}
          >
            {goal.text}
          </Animated.Text>
        ) : null}
      </View>

      <View style={styles.middle}>
        <Animated.View
          key={action.kind}
          entering={FadeInDown.duration(motion.slow).easing(motion.easeOut)}
          style={styles.action}
        >
          {disabled ? (
            // Nothing to press yet: a plain status, not a dead button.
            <View testID="home-action" style={styles.status}>
              <AppText variant="bodyMedium" style={styles.statusText}>
                {label}
              </AppText>
            </View>
          ) : (
            <PrimaryButton
              testID="home-action"
              label={label}
              onPress={() => {
                haptics.tap();
                go();
              }}
            />
          )}
          {extra ? (
            <Pressable
              testID="home-extra"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                haptics.tap();
                extra.go();
              }}
              style={styles.extra}
            >
              <AppText variant="label" style={styles.muted}>
                {extra.label}
              </AppText>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>

      <Pressable
        testID="open-book"
        accessibilityRole="button"
        onPress={() => navigation.navigate('Book')}
        style={[styles.book, { paddingBottom: insets.bottom + 28 }]}
      >
        <AppText variant="bodyMedium" style={styles.link}>
          {t.home.book}
        </AppText>
      </Pressable>
    </View>
  );
}

interface Described {
  label: string;
  go: () => void;
  disabled?: boolean;
  extra?: { label: string; go: () => void };
}

function describe(
  a: HomeAction,
  t: Strings,
  today: string,
  navigation: Nav,
): Described {
  const nav =
    <K extends keyof RootStackParamList>(
      name: K,
      params?: RootStackParamList[K],
    ) =>
    () =>
      (navigation.navigate as (n: K, p?: RootStackParamList[K]) => void)(
        name,
        params,
      );
  switch (a.kind) {
    case 'setup': {
      const target =
        a.step === 'vow'
          ? nav('Pratigya')
          : a.step === 'plan'
          ? nav('Plan', { first: true })
          : nav('Setup', { step: a.step });
      return {
        label: t.home.continueSetup(t.home.setupSheets[a.step]),
        go: target,
      };
    }
    case 'resting':
      return {
        label: t.home.restingUntil(shortDate(t, a.until)),
        go: () => {},
        disabled: true,
        extra: {
          label: t.home.endRest,
          go: () => {
            useBook.getState().endRest();
            navigation.navigate('Reassess');
          },
        },
      };
    case 'reassess':
      return { label: t.home.reassess, go: nav('Reassess') };
    case 'inProgress':
      return {
        label: t.home.inProgress(a.session.order + 1),
        go: nav('InProgress', { id: a.session.id }),
      };
    case 'markPast':
      return {
        label: t.home.markPast(
          a.session.date === addDays(today, -1)
            ? t.home.yesterday
            : dayDate(t, a.session.date),
          a.session.order + 1,
        ),
        go: nav('Mark', { id: a.session.id }),
      };
    case 'finishGoal':
      return { label: t.home.finishGoal, go: nav('GoalDone') };
    case 'review':
      return {
        label: t.home.review,
        go: nav('Review', { week: a.week }),
        extra: { label: t.home.planFirst, go: nav('Plan') },
      };
    case 'reread':
      return {
        label: t.home.reread,
        go: nav('Setup', { returnTo: 'reread' }),
      };
    case 'start':
      return {
        label: t.home.start(a.index + 1, a.session.what),
        go: nav('Start', { id: a.session.id }),
        extra: { label: t.home.editPlan, go: nav('Plan', { date: today }) },
      };
    case 'tomorrow':
      return {
        label: t.home.tomorrow(a.session.what),
        go: () => {},
        disabled: true,
        extra: {
          label: t.home.editPlan,
          go: nav('Plan', { date: a.session.date }),
        },
      };
    case 'plan':
      return {
        label: a.date === today ? t.home.planToday : t.home.planTomorrow,
        go: nav('Plan', { date: a.date }),
      };
  }
}

const styles = StyleSheet.create({
  status: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  statusText: {
    textAlign: 'center',
  },
  screen: {
    flex: 1,
    backgroundColor: colors.stone,
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  top: {
    paddingHorizontal: spacing.gutter,
    height: SKY,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  light: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  week: {
    marginTop: spacing.xl,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  goal: {
    ...typography.title,
    marginTop: 26,
    color: colors.white,
    textAlign: 'center',
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.gutter,
  },
  action: {
    gap: spacing.lg,
  },
  extra: {
    alignSelf: 'center',
  },
  muted: {
    color: colors.textMuted,
  },
  book: {
    alignItems: 'center',
  },
  link: {
    color: colors.saffron,
  },
});
