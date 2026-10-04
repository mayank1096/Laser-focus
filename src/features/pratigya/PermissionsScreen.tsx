import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { useProfile, type Permission } from '../account/store';
import { VOW_STEPS } from './PathScreen';

const ROWS: { id: Permission; label: string; why: string }[] = [
  {
    id: 'screenTime',
    label: 'Screen Time',
    why: 'To see if a removed app returns',
  },
  {
    id: 'focus',
    label: 'Focus & Do Not Disturb',
    why: 'To silence the phone in session',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    why: 'For the nightly reminder only',
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
          {ROWS.map(r => {
            const on = permissions[r.id];
            return (
              <View key={r.id} style={styles.row}>
                <View style={styles.flex}>
                  <AppText variant="body">{r.label}</AppText>
                  <AppText variant="micro" style={styles.muted}>
                    {r.why}
                  </AppText>
                </View>
                <Pressable
                  testID={`allow-${r.id}`}
                  accessibilityRole="button"
                  accessibilityState={{ checked: on }}
                  disabled={on}
                  hitSlop={6}
                  onPress={() => {
                    haptics.success();
                    grant(r.id);
                  }}
                  style={[styles.pill, on ? styles.pillOn : styles.pillOff]}
                >
                  <AppText
                    variant="label"
                    style={{ color: on ? colors.white : colors.saffron }}
                  >
                    {on ? 'Allowed' : 'Allow'}
                  </AppText>
                </Pressable>
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
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
  muted: {
    color: colors.textMuted,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.saffron,
  },
  pillOn: {
    backgroundColor: colors.saffron,
  },
  pillOff: {
    backgroundColor: colors.white,
  },
});
