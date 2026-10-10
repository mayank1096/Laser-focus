import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { GLASS_EDGE, GlassFill } from '../../components/Glass';
import { MistBackdrop } from '../../components/MistBackdrop';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { appDay, lastSeven } from '../../core/days';
import { dayMark, sessionsOn } from '../../core/home';
import type { Mark } from '../../core/model';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clockOf } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { MIST, motion, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { addDays } from '../../utils/date';
import { levelOf, WeekRow } from '../components/MarkBox';
import { MarigoldShower } from '../components/MarigoldShower';
import { RewardCard } from '../components/RewardCard';

/**
 * The reward. A card spins in; hold it and it fills (●) and petals are
 * thrown; let go past half way for a half day. A beat after the card fills,
 * the same day's box in the week above fills too.
 */
export function MarkScreen({ navigation, route }: RootScreenProps<'Mark'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(280, width - spacing.gutter * 2 - 40);
  const state = useBook();
  const session = state.sessions.find(x => x.id === route.params.id);
  const [mark, setMark] = useState<Mark | null>(session?.mark ?? null);
  const [finished, setFinished] = useState(session?.outcome ?? '');
  const [wrong, setWrong] = useState<Set<string>>(
    new Set(session?.wentWrong ?? []),
  );
  const fill = useSharedValue(levelOf(mark));
  const [shower, setShower] = useState(0);
  const [weekFilled, setWeekFilled] = useState(mark !== null);
  const weekIn = useSharedValue(mark !== null ? 1 : 0);
  const weekStyle = useAnimatedStyle(() => ({
    opacity: weekIn.value,
    transform: [{ translateY: (1 - weekIn.value) * -12 }],
  }));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const revealWeek = () => {
    timers.current.push(
      setTimeout(() => {
        weekIn.value = withTiming(1, {
          duration: motion.slow,
          easing: motion.easeOut,
        });
      }, 1800),
      setTimeout(() => setWeekFilled(true), 2300),
    );
  };
  const [cardY, setCardY] = useState(0);
  if (!session) {
    return null;
  }
  const today = appDay();
  const days = lastSeven(today);

  const choose = (m: Mark) => {
    setMark(m);
    revealWeek();
    if (m === 'full') {
      setShower(n => n + 1);
    }
    fill.value = withTiming(levelOf(m), { duration: 300 });
    useBook.getState().markSession(session.id, m);
  };

  // Another session still to come today waits on Home for its own time.
  const more =
    session.date === today &&
    sessionsOn(state, today).some(
      s => s.order > session.order && !s.mark && !s.startedAt,
    );
  // Today's last box is in: straight on to planning tomorrow.
  const lastToday = session.date === today && !more;

  const proceed = () => {
    if (!mark) {
      return;
    }
    useBook
      .getState()
      .markSession(
        session.id,
        mark,
        mark === 'full'
          ? { finished: finished.trim() || session.outcome }
          : { wentWrong: [...wrong] },
      );
    haptics.tap();
    if (lastToday) {
      navigation.replace('Plan', { date: addDays(today, 1) });
    } else {
      navigation.replace('Home', { tab: 'today' });
    }
  };

  const reasons = [
    ...new Set([
      ...(session.wentWrong ?? []),
      ...(session.dontDo ?? []),
      t.mark.reasons.phone,
      t.mark.reasons.sleep,
      t.mark.reasons.mood,
      t.mark.reasons.time,
      t.mark.reasons.other,
    ]),
  ];

  return (
    <View style={styles.screen} testID="mark">
      <MistBackdrop />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Kept in place but hidden until the card is marked and the petals
            have fallen; then it rises in and the day's box fills. */}
        <Animated.View
          style={[styles.week, weekStyle]}
          pointerEvents={weekFilled ? 'auto' : 'none'}
        >
          <GlassFill />
          <WeekRow
            dark
            days={days}
            marks={days.map(d =>
              d === session.date && !weekFilled ? null : dayMark(state, d),
            )}
            today={today}
            letters={t.common.dayLetter}
            size={32}
          />
        </Animated.View>

        <View
          style={styles.cardWrap}
          onLayout={e =>
            setCardY(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)
          }
        >
          <RewardCard
            width={cardWidth}
            eyebrow={t.common.session(session.order + 1)}
            title={session.what}
            outcome={session.outcome}
            brand={t.signIn.eyebrow}
            holdLabel={t.mark.hold}
            fill={fill}
            locked={mark !== null}
            fullLabel={t.mark.full}
            halfLabel={t.mark.half}
            onMark={choose}
          />
        </View>

        {mark ? (
          <Animated.View
            entering={FadeInDown.duration(motion.slow).easing(motion.easeOut)}
            style={styles.after}
          >
            {mark === 'full' ? (
              <>
                <AppText variant="eyebrow" style={styles.light}>
                  {t.mark.finished}
                </AppText>
                <TextField
                  testID="finished"
                  accessibilityLabel={t.mark.finished}
                  value={finished}
                  onChangeText={setFinished}
                />
              </>
            ) : (
              <>
                <AppText variant="eyebrow" style={styles.light}>
                  {t.mark.wentWrong}
                </AppText>
                <ChipRow>
                  {reasons.map(r => (
                    <Chip
                      key={r}
                      testID={`why-${r}`}
                      role="checkbox"
                      onColor
                      label={r}
                      selected={wrong.has(r)}
                      onPress={() =>
                        setWrong(prev => {
                          const next = new Set(prev);
                          if (next.has(r)) {
                            next.delete(r);
                          } else {
                            next.add(r);
                          }
                          return next;
                        })
                      }
                    />
                  ))}
                </ChipRow>
              </>
            )}
            {session.startedAt ? (
              <AppText variant="micro" style={styles.muted}>
                {t.mark.meta(
                  clockOf(t, new Date(session.startedAt)),
                  t.common.minutes(session.minutes),
                )}
              </AppText>
            ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>

      <MarigoldShower
        fire={shower}
        x={width / 2}
        y={insets.top + spacing.xl + cardY}
        spread={cardWidth}
        width={width}
      />

      {/* Nothing to press until the card is marked. */}
      {mark ? (
        <Animated.View
          entering={FadeInDown.delay(600)
            .duration(motion.slow)
            .easing(motion.easeOut)}
          style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
        >
          <PrimaryButton
            tone="light"
            testID="mark-next"
            label={lastToday ? t.dayDone.plan : t.common.done}
            onPress={proceed}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MIST[0],
  },
  light: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xxl,
  },
  week: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_EDGE,
  },
  muted: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  after: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  footer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.gutter,
  },
});
