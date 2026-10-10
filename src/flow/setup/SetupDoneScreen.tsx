import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

/** The end of setup: the Action Book is written. */
export function SetupDoneScreen({ navigation }: RootScreenProps<'SetupDone'>) {
  const t = useT();
  return (
    <SimpleScreen
      testID="setup-done"
      hideBack
      onBack={() => {}}
      art={art.drawingBow}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            testID="go-home"
            label={t.setupDone.home}
            onPress={() => {
              useBook.getState().setSetup('done');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home', params: { arrive: true } }],
              });
            }}
          />
        </View>
      }
    >
      <View style={styles.card}>
        <Animated.Text entering={rise(0)} style={typography.title}>
          {t.setupDone.title}
        </Animated.Text>
        <Animated.View entering={rise(1)}>
          <AppText variant="body" style={styles.note}>
            {t.setupDone.note}
          </AppText>
        </Animated.View>
      </View>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  note: {
    color: colors.textMuted,
  },
  footer: {
    gap: spacing.md,
  },
});
