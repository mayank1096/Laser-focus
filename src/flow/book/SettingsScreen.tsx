import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SegmentedControl } from '../../components/SegmentedControl';
import { useBook } from '../../core/store';
import { useProfile, type Language } from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { RhythmEditor } from '../components/RhythmEditor';
import { SheetPage } from '../components/SheetPage';
import { SheetTitle } from '../components/SheetTitle';

/** Language, rhythm, how it works, and the account. Nothing else. */
export function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const t = useT();
  const language = useProfile(s => s.language);
  const setLanguage = useProfile(s => s.setLanguage);
  const [how, setHow] = useState(false);
  const [printNote, setPrintNote] = useState(false);
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
        <Section title={t.settings.language}>
          <SegmentedControl<Language>
            testIDPrefix="settings-language"
            value={language}
            segments={[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिंदी' },
            ]}
            onChange={setLanguage}
          />
        </Section>

        <View style={styles.rhythm}>
          <RhythmEditor />
        </View>

        <Section>
          <Pressable
            testID="settings-how"
            accessibilityRole="button"
            accessibilityState={{ expanded: how }}
            onPress={() => {
              haptics.selection();
              setHow(h => !h);
            }}
            style={styles.row}
          >
            <AppText variant="bodyMedium" style={styles.flex}>
              {t.settings.how}
            </AppText>
            <ChevronDown
              width={18}
              height={18}
              color={colors.textMuted}
              style={{ transform: [{ rotate: how ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          {how ? (
            <Animated.View
              entering={FadeIn.duration(motion.base)}
              style={styles.how}
            >
              {t.settings.howSteps.map((step, i) => (
                <AppText key={step} variant="body" style={styles.muted}>
                  {`${i + 1}.  ${step}`}
                </AppText>
              ))}
            </Animated.View>
          ) : null}
          <Row
            testID="settings-print"
            label={t.settings.print}
            onPress={() => setPrintNote(true)}
          />
          {printNote ? (
            <AppText variant="caption">{t.setupDone.printSoon}</AppText>
          ) : null}
          <Row
            testID="settings-export"
            label={t.settings.export}
            onPress={exportData}
          />
        </Section>

        <Section>
          <Row
            testID="sign-out"
            label={t.settings.signOut}
            onPress={() => {
              useProfile.setState({ account: null });
              toSignIn();
            }}
          />
          <Row
            testID="delete-account"
            label={t.settings.delete}
            danger
            onPress={() => setDeleteSure(true)}
          />
        </Section>
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

function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <AppText variant="eyebrow">{title}</AppText> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  onPress,
  danger,
  testID,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={styles.row}
    >
      <AppText variant="bodyMedium" style={danger ? styles.danger : undefined}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rhythm: {
    marginTop: spacing.xl,
    marginBottom: 40,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  flex: {
    flex: 1,
  },
  how: {
    gap: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
  danger: {
    color: colors.danger,
  },
});
