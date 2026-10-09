import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { appDay, lastSeven } from '../../core/days';
import { dayMark, sessionsOn } from '../../core/home';
import type { Mark } from '../../core/model';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { clockOf } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { WeekRow } from '../components/MarkBox';
import { MarigoldShower } from '../components/MarigoldShower';
import { RewardCard } from '../components/RewardCard';

/**
 * The reward. A card spins in; hold it and it fills (●) and petals are
 * thrown, or swipe across it for the zig-zag. A beat after the card fills,
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
  const fill = useSharedValue(mark === 'full' ? 1 : 0);
  const zig = useSharedValue(mark === 'half' ? 1 : 0);
  const [shower, setShower] = useState(0);
  const [cardY, setCardY] = useState(0);
  if (!session) {
    return null;
  }
  const today = appDay();
  const days = lastSeven(today);

  const choose = (m: Mark) => {
    setMark(m);
    if (m === 'full') {
      setShower(n => n + 1);
    }
    fill.value = withTiming(m === 'full' ? 1 : 0, { duration: 300 });
    zig.value = withTiming(m === 'half' ? 1 : 0, { duration: 300 });
    useBook.getState().markSession(session.id, m);
  };

  // Another session still to come today waits on Home for its own time.
  const more =
    session.date === today &&
    sessionsOn(state, today).some(
      s => s.order > session.order && !s.mark && !s.startedAt,
    );

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
    if (more) {
      navigation.replace('Home', { tab: 'today' });
    } else {
      navigation.replace('DayDone', { date: session.date });
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.week}>
          <WeekRow
            days={days}
            marks={days.map(d => dayMark(state, d))}
            today={today}
            letters={t.common.dayLetter}
            size={32}
            delayFor={d => (d === session.date ? 700 : 0)}
          />
        </View>

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
            zig={zig}
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
                <AppText variant="eyebrow">{t.mark.finished}</AppText>
                <TextField
                  testID="finished"
                  accessibilityLabel={t.mark.finished}
                  value={finished}
                  onChangeText={setFinished}
                />
              </>
            ) : (
              <>
                <AppText variant="eyebrow">{t.mark.wentWrong}</AppText>
                <ChipRow>
                  {reasons.map(r => (
                    <Chip
                      key={r}
                      testID={`why-${r}`}
                      role="checkbox"
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          testID="mark-next"
          label={t.common.done}
          disabled={!mark}
          onPress={proceed}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.stone,
  },
  content: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xxl,
  },
  week: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  muted: {
    color: colors.textMuted,
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
