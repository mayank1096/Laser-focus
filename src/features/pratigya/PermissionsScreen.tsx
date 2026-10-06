import React from 'react';
import { StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import BellOn from '../../assets/icons/bell-on.svg';
import Hourglass from '../../assets/icons/hourglass.svg';
import Moon from '../../assets/icons/moon.svg';
import { AllowButton } from '../../components/AllowButton';
import { OptionIcon, type IconComponent } from '../../components/OptionIcon';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { useProfile, type Permission } from '../account/store';
import { VOW_STEPS } from './PathScreen';

const ROWS: {
  id: Permission;
  label: string;
  why: string;
  Icon: IconComponent;
}[] = [
  {
    id: 'screenTime',
    label: 'Screen Time',
    why: 'To see if a removed app returns',
    Icon: Hourglass,
  },
  {
    id: 'focus',
    label: 'Focus & Do Not Disturb',
    why: 'To silence the phone in session',
    Icon: Moon,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    why: 'For the nightly reminder only',
    Icon: BellOn,
  },
];

/**
 * TODO(devs): each Allow opens the real system prompt — iOS
 * FamilyControls authorization, Android Usage Access / Notification Policy
 * access, and the notification permission.
 */
export function PermissionsScreen({
  navigation,
}: RootScreenProps<'Permissions'>) {
  const permissions = useProfile(s => s.permissions);
  const grant = useProfile(s => s.grant);
  const pratigya = useProfile(s => s.pratigya);
  const left = ROWS.filter(r => !permissions[r.id]).length;

  return (
    <SimpleScreen
      testID="permissions"
      art={art.bowShoulders}
      progress={{ total: VOW_STEPS, filled: 4 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label={left ? `${left} left` : 'Next'}
          disabled={left > 0}
          onPress={() =>
            // Abhimanyu only silences; nothing has to be deleted.
            navigation.navigate(
              pratigya === 'abhimanyu' ? 'TakeVow' : 'ClearField',
            )
          }
        />
      }
    >
      <QuestionHeader
        eyebrow="Let us hold you to it"
        title="A vow needs a witness. Let the app watch."
        subtitle="Nothing leaves your phone. We only check what you promised."
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          {ROWS.map((r, i) => {
            const on = permissions[r.id];
            return (
              <View key={r.id} style={[styles.row, i > 0 && styles.divided]}>
                <View style={styles.iconSlot}>
                  <OptionIcon Icon={r.Icon} active={on} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyMedium">{r.label}</AppText>
                  <AppText variant="micro" style={styles.muted}>
                    {r.why}
                  </AppText>
                </View>
                <AllowButton
                  testID={`allow-${r.id}`}
                  granted={on}
                  onAllow={() => grant(r.id)}
                />
              </View>
            );
          })}
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  iconSlot: {
    alignSelf: 'flex-start',
    paddingTop: 1,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  muted: {
    color: colors.textMuted,
  },
});
