import React, { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import ArrowDown from '../../assets/icons/arrow-down.svg';
import BookOpen from '../../assets/icons/book-open.svg';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import Languages from '../../assets/icons/languages.svg';
import LogOut from '../../assets/icons/log-out.svg';
import Trash from '../../assets/icons/trash.svg';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SettingsRow, SettingsSection } from '../../components/SettingsList';
import { useBook } from '../../core/store';
import { useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import { RhythmEditor } from '../components/RhythmEditor';
import { SheetPage } from '../components/SheetPage';
import { SheetTitle } from '../components/SheetTitle';

/** Language, rhythm, how it works, and the account. Nothing else. */
export function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const t = useT();
  const language = useProfile(s => s.language);
  const setLanguage = useProfile(s => s.setLanguage);
  const [how, setHow] = useState(false);
  const [deleteSure, setDeleteSure] = useState(false);

  const toSignIn = () =>
    navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });

  const exportData = () => {
    const { sessions, values, goals, milestones, tasks, reviews, lessons } =
      useBook.getState();
    Share.share({
      title: t.settings.export,
      message: JSON.stringify(
        { values, goals, milestones, tasks, sessions, reviews, lessons },
        null,
        2,
      ),
    }).catch(() => {});
  };

  return (
    <>
      <SheetPage
        testID="settings"
        eyebrow={t.account.accountSection}
        title={t.settings.title}
        subtitle={`${t.settings.language} · ${t.settings.focus} · ${t.settings.review}`}
        onBack={() => navigation.goBack()}
      >
        <SettingsSection title={t.settings.language}>
          <SettingsRow
            testID="settings-language"
            Icon={Languages}
            title={t.account.language}
            detail={t.account.languageName}
            last
            trailing={
              <AppText variant="label" style={styles.switchLang}>
                {language === 'en' ? 'हिंदी' : 'English'}
              </AppText>
            }
            onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          />
        </SettingsSection>

        <View style={styles.rhythm}>
          <RhythmEditor />
        </View>

        <View style={styles.groups}>
          <SettingsSection title={t.settings.helpSection}>
            <SettingsRow
              testID="settings-how"
              Icon={BookOpen}
              title={t.settings.how}
              detail={t.settings.howSub}
              onPress={() => setHow(h => !h)}
              trailing={
                <ChevronDown
                  width={16}
                  height={16}
                  color={colors.textMuted}
                  strokeWidth={1.75}
                  style={{ transform: [{ rotate: how ? '180deg' : '0deg' }] }}
                />
              }
            >
              {how ? (
                <Animated.View
                  entering={FadeIn.duration(motion.base)}
                  style={styles.how}
                >
                  {t.settings.howSteps.map((step, i) => (
                    <View key={step} style={styles.step}>
                      <AppText variant="micro" style={styles.stepN}>
                        {i + 1}
                      </AppText>
                      <AppText variant="detail" style={styles.flex}>
                        {step}
                      </AppText>
                    </View>
                  ))}
                </Animated.View>
              ) : null}
            </SettingsRow>
            <SettingsRow
              testID="settings-export"
              Icon={ArrowDown}
              title={t.settings.export}
              detail={t.settings.exportSub}
              onPress={exportData}
              last
            />
          </SettingsSection>

          <SettingsSection title={t.account.accountSection}>
            <SettingsRow
              testID="sign-out"
              Icon={LogOut}
              title={t.settings.signOut}
              onPress={() => {
                useProfile.setState({ account: null });
                toSignIn();
              }}
            />
            <SettingsRow
              testID="delete-account"
              Icon={Trash}
              title={t.settings.delete}
              detail={t.settings.deleteSub}
              danger
              last
              onPress={() => setDeleteSure(true)}
            />
          </SettingsSection>
        </View>
      </SheetPage>

      <BottomSheet
        visible={deleteSure}
        onClose={() => setDeleteSure(false)}
        accessibilityLabel={t.settings.delete}
      >
        <SheetTitle
          title={t.settings.delete}
          subtitle={t.settings.deleteSure}
        />
        <PrimaryButton
          testID="delete-confirm"
          label={t.common.delete}
          shadow="none"
          onPress={() => {
            setDeleteSure(false);
            useBook.getState().reset();
            useProfile.getState().reset();
            toSignIn();
          }}
        />
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  switchLang: {
    color: colors.saffron,
  },
  rhythm: {
    marginVertical: spacing.group,
  },
  flex: {
    flex: 1,
  },
  groups: {
    gap: spacing.group,
  },
  how: {
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingBottom: 16,
    paddingLeft: spacing.xl + 34,
  },
  step: {
    flexDirection: 'row',
    gap: 10,
  },
  stepN: {
    width: 12,
    color: colors.saffron,
    lineHeight: 13 * 1.45,
  },
});
