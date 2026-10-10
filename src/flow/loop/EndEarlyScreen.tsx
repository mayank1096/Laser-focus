import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { HoldButton } from '../../components/HoldButton';
import { rise } from '../../components/QuestionHeader';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';

/** Ending early is a serious act; the whole screen says so. */
const DEEP_RED = '#7A0C12';
/** Ten minutes in, a session still counts as a half day. */
const HALF_MINUTES = 10;

/** There is no pause. Ending early is possible, but it is a held decision. */
export function EndEarlyScreen({
  navigation,
  route,
}: RootScreenProps<'EndEarly'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const session = useBook(s => s.sessions.find(x => x.id === route.params.id));
  const [reason, setReason] = useState<string | null>(null);
  if (!session?.startedAt) {
    return <View style={styles.screen} />;
  }
  const sat = Math.floor(
    (now().getTime() - Date.parse(session.startedAt)) / 60000,
  );
  const counts = sat >= HALF_MINUTES;

  return (
    <View
      testID="end-early"
      style={[styles.screen, { paddingTop: insets.top + 56 }]}
    >
      <Animated.Text
        entering={rise(0)}
        style={[typography.eyebrow, styles.dim]}
        numberOfLines={1}
      >
        {t.endEarly.eyebrow(sat, session.what)}
      </Animated.Text>
      <Animated.Text
        entering={rise(1)}
        style={[typography.title, styles.white, styles.title]}
      >
        {t.endEarly.title}
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={[typography.body, styles.soft]}>
        {counts ? t.endEarly.counts : t.endEarly.wontCount(HALF_MINUTES - sat)}
      </Animated.Text>
      <Animated.View entering={rise(3)} style={styles.reasons}>
        <AppText variant="eyebrow" style={styles.dim}>
          {t.endEarly.what}
        </AppText>
        <ChipRow>
          {t.endEarly.reasons.map(r => (
            <Chip
              key={r}
              testID={`reason-${r}`}
              role="radio"
              label={r}
              selected={reason === r}
              onColor
              onPress={() => setReason(r)}
            />
          ))}
        </ChipRow>
        <AppText variant="caption" style={styles.dim}>
          {t.endEarly.honest}
        </AppText>
      </Animated.View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <HoldButton
          testID="end-hold"
          label={t.endEarly.hold}
          onDark
          tone="red"
          duration={2000}
          onComplete={() => {
            useBook
              .getState()
              .markSession(session.id, counts ? 'half' : 'empty', {
                wentWrong: reason ? [reason] : [],
              });
            navigation.replace('Mark', { id: session.id });
          }}
        />
        <Pressable
          testID="back-to-focus"
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => navigation.goBack()}
          style={styles.link}
        >
          <AppText variant="label" style={styles.soft}>
            {t.endEarly.back}
          </AppText>
        </Pressable>
        {counts ? null : (
          <Pressable
            testID="not-started"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              useBook.getState().unstartSession(session.id);
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            }}
            style={styles.link}
          >
            <AppText variant="micro" style={styles.dim}>
              {t.progress.notStarted}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DEEP_RED,
    paddingHorizontal: spacing.gutter,
  },
  title: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  white: {
    color: colors.white,
  },
  soft: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  dim: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  reasons: {
    marginTop: 30,
    gap: spacing.md,
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.lg,
  },
  link: {
    alignSelf: 'center',
  },
});
