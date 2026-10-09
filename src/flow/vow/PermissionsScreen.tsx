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
import { useProfile, type Permission } from '../../features/account/store';
import { useT } from '../../i18n';
import { VOW_STEPS } from './PratigyaScreen';

const ROWS: {
  id: Permission;
  Icon: IconComponent;
}[] = [
  {
    id: 'screenTime',
    Icon: Hourglass,
  },
  {
    id: 'focus',
    Icon: Moon,
  },
  {
    id: 'notifications',
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
  const t = useT();
  const permissions = useProfile(s => s.permissions);
  const grant = useProfile(s => s.grant);
  const pratigya = useProfile(s => s.pratigya);
  const left = ROWS.filter(r => !permissions[r.id]).length;

  return (
    <SimpleScreen
      testID="permissions"
      art={art.bowShoulders}
      progress={{ total: VOW_STEPS, filled: 3 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label={left ? t.vow.left(left) : t.common.next}
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
        eyebrow={t.vow.permEyebrow}
        title={t.vow.permTitle}
        subtitle={t.vow.permSub}
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
                  <AppText variant="bodyMedium">{t.vow.perms[r.id][0]}</AppText>
                  <AppText variant="micro" style={styles.muted}>
                    {t.vow.perms[r.id][1]}
                  </AppText>
                </View>
                <AllowButton
                  testID={`allow-${r.id}`}
                  granted={on}
                  label={t.vow.allow}
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
    paddingLeft: 16,
    paddingRight: spacing.md,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  iconSlot: {
    alignSelf: 'flex-start',
    paddingTop: 1,
    marginRight: spacing.md,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  muted: {
    color: colors.textMuted,
  },
});
