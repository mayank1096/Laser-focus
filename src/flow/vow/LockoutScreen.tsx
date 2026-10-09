import React from 'react';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { PRATIGYAS, useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { haptics } from '../../utils/haptics';

/**
 * Shown instead of the app while the vow is broken.
 * TODO(devs): set `brokenAt` when the native watcher sees a removed app
 * reinstalled (apps marked "For work" are ignored); "check again" re-scans
 * before letting the user back in.
 */
export function LockoutScreen({ navigation }: RootScreenProps<'Lockout'>) {
  const t = useT();
  const pratigya = useProfile(s => s.pratigya) ?? 'arjun';
  const restoreVow = useProfile(s => s.restoreVow);
  return (
    <SimpleScreen
      testID="lockout"
      tone="blush"
      hideBack
      onBack={() => {}}
      footer={
        <PrimaryButton
          testID="next-button"
          label={t.vow.lockFixed}
          shadow="none"
          onPress={() => {
            haptics.success();
            restoreVow();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        />
      }
    >
      <QuestionHeader
        eyebrow={`${PRATIGYAS[pratigya].name} प्रतिज्ञा · ${t.vow.lockEyebrow}`}
        title={t.vow.lockTitle}
        subtitle={t.vow.lockSub}
      />
    </SimpleScreen>
  );
}
