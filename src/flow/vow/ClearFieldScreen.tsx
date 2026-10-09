import { DeleteButton } from '../../components/DeleteButton';
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
import { useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import { VOW_STEPS } from './PratigyaScreen';

/**
 * TODO(devs): "Delete" opens the system uninstall prompt for that package
 * (Android ACTION_DELETE) or the app's Settings page on iOS; "Check again"
 * re-scans installed apps.
 */
export function ClearFieldScreen({
  navigation,
}: RootScreenProps<'ClearField'>) {
  const t = useT();
  const apps = useProfile(s => s.apps);
  const markAppDeleted = useProfile(s => s.markAppDeleted);
  const setAppForWork = useProfile(s => s.setAppForWork);
  const left = apps.filter(a => !a.deleted && !a.forWork).length;

  return (
    <SimpleScreen
      testID="clear-field"
      art={art.kneeling}
      progress={{ total: VOW_STEPS, filled: 4 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label={left ? t.vow.checkAgain : t.common.next}
          disabled={left > 0}
          onPress={() => navigation.navigate('TakeVow')}
        />
      }
    >
      <QuestionHeader
        eyebrow={t.vow.clearEyebrow}
        title={t.vow.clearTitle(left)}
        subtitle={t.vow.clearSub}
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          {apps.map((a, i) => (
            <View key={a.name} style={[styles.row, i > 0 && styles.divided]}>
              <View style={styles.flex}>
                <AppText
                  variant="body"
                  style={a.deleted ? styles.muted : null}
                >
                  {a.name}
                </AppText>
                {a.forWork ? (
                  <AppText variant="micro" style={styles.note}>
                    {t.vow.forWorkNote}
                  </AppText>
                ) : null}
              </View>
              {a.deleted ? null : (
                <Pressable
                  testID={`work-${a.name}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: Boolean(a.forWork) }}
                  hitSlop={6}
                  onPress={() => {
                    haptics.selection();
                    setAppForWork(a.name, !a.forWork);
                  }}
                  style={[styles.work, a.forWork && styles.workOn]}
                >
                  <AppText
                    variant="label"
                    style={a.forWork ? styles.workTextOn : styles.note}
                  >
                    {t.vow.forWork}
                  </AppText>
                </Pressable>
              )}
              {a.forWork ? null : (
                <DeleteButton
                  testID={`delete-${a.name}`}
                  deleted={a.deleted}
                  labels={[t.vow.deleteApp, t.vow.deleted]}
                  onDelete={() => markAppDeleted(a.name)}
                />
              )}
            </View>
          ))}
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
    paddingVertical: 12,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  note: {
    color: colors.textMuted,
  },
  work: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  workOn: {
    borderColor: colors.ink,
    backgroundColor: colors.ink,
  },
  workTextOn: {
    color: colors.white,
  },
});
