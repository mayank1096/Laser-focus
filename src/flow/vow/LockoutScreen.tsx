import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MistBackdrop } from '../../components/MistBackdrop';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { PRATIGYAS, useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, MIST_RED, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';

/**
 * Shown instead of the app while the vow is broken: the saffron haze gone
 * red, and one plain way back.
 * TODO(devs): set `brokenAt` when the native watcher sees a removed app
 * reinstalled (apps marked "For work" are ignored); "check again" re-scans
 * before letting the user back in.
 */
export function LockoutScreen({ navigation }: RootScreenProps<'Lockout'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const pratigya = useProfile(s => s.pratigya) ?? 'arjun';
  const restoreVow = useProfile(s => s.restoreVow);
  return (
    <View style={styles.screen} testID="lockout">
      <MistBackdrop colours={MIST_RED} />
      <View style={[styles.body, { paddingTop: insets.top + 120 }]}>
        <Animated.Text entering={rise(0)} style={styles.eyebrow}>
          {`${PRATIGYAS[pratigya].name} प्रतिज्ञा · ${t.vow.lockEyebrow}`}
        </Animated.Text>
        <Animated.Text
          entering={rise(1)}
          style={styles.title}
          accessibilityRole="header"
        >
          {t.vow.lockTitle}
        </Animated.Text>
        <Animated.Text entering={rise(2)} style={styles.sub}>
          {t.vow.lockSub}
        </Animated.Text>
      </View>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <PrimaryButton
          testID="next-button"
          tone="light"
          label={t.vow.lockFixed}
          shadow="none"
          onPress={() => {
            haptics.success();
            restoreVow();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MIST_RED[0],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.gutter,
    gap: 16,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: 'rgba(255, 255, 255, 0.72)',
  },
  title: {
    ...typography.display,
    fontSize: 36,
    lineHeight: 42,
    color: colors.white,
  },
  sub: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  footer: {
    paddingHorizontal: spacing.gutter,
  },
});
