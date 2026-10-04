import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { now } from '../../utils/clock';
import { haptics } from '../../utils/haptics';
import { useStreak } from '../progress';
import { PRATIGYAS, useProfile } from '../account/store';

/**
 * Shown instead of the app while the vow is broken.
 * TODO(devs): set `brokenAt` when the native watcher sees a removed app
 * reinstalled; "check again" re-scans before letting the user back in.
 */
export function LockoutScreen({ navigation }: RootScreenProps<'Lockout'>) {
  const { pratigya, brokenAt } = useProfile();
  const restoreVow = useProfile(s => s.restoreVow);
  const streak = useStreak();
  const hours = brokenAt
    ? Math.max(
        0,
        24 - Math.floor((now().getTime() - Date.parse(brokenAt)) / 3.6e6),
      )
    : 24;

  return (
    <SimpleScreen
      testID="lockout"
      tone="blush"
      hideBack
      onBack={() => {}}
      footer={
        <PrimaryButton
          testID="next-button"
          label="I deleted it — check again"
          shadow="none"
          onPress={() => {
            haptics.success();
            restoreVow();
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          }}
        />
      }
    >
      <QuestionHeader
        eyebrow={`${PRATIGYAS[pratigya ?? 'arjun'].name} प्रतिज्ञा · Broken`}
        title="You put down the bow. A distraction came back."
        subtitle="Laser Focus stays closed until it’s deleted again. Your streak is frozen, not lost."
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          <View style={[styles.row, styles.white]}>
            <AppText variant="body">Social app reinstalled</AppText>
            <AppText variant="micro" style={styles.muted}>
              Today
            </AppText>
          </View>
          <View style={[styles.row, styles.pink]}>
            <AppText variant="body">{`${streak}-day streak`}</AppText>
            <AppText variant="micro" style={styles.ember}>
              {`${hours}h left to save it`}
            </AppText>
          </View>
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
  },
  white: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pink: {
    backgroundColor: colors.blushDeep,
  },
  muted: {
    color: colors.textMuted,
  },
  ember: {
    color: colors.ember,
  },
});
