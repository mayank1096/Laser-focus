import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { OutlineButton, PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';

/** The end of setup. Paper is the point: the sheets belong on the desk. */
export function SetupDoneScreen({ navigation }: RootScreenProps<'SetupDone'>) {
  const t = useT();
  const [printNote, setPrintNote] = useState(false);
  return (
    <SimpleScreen
      testID="setup-done"
      hideBack
      onBack={() => {}}
      art={art.drawingBow}
      footer={
        <View style={styles.footer}>
          <OutlineButton
            testID="print"
            label={t.setupDone.print}
            onPress={() => {
              haptics.tap();
              setPrintNote(true);
            }}
          />
          <PrimaryButton
            testID="go-home"
            label={t.setupDone.home}
            onPress={() => {
              useBook.getState().setSetup('done');
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
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
        {printNote ? (
          <AppText variant="caption">{t.setupDone.printSoon}</AppText>
        ) : null}
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
