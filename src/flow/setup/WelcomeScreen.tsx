import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { TextField } from '../../components/TextField';
import { useBook } from '../../core/store';
import { useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

/** Shown once. The same card lives in Settings as "How this app works". */
export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  const t = useT();
  const [name, setName] = useState(useProfile.getState().name);
  return (
    <SimpleScreen
      testID="welcome"
      hideBack
      onBack={() => {}}
      art={art.standing}
      footer={
        <PrimaryButton
          testID="begin"
          label={t.welcome.begin}
          disabled={name.trim().length < 2}
          onPress={() => {
            useProfile.getState().setName(name.trim());
            useBook.getState().setWelcomed();
            navigation.reset({ index: 0, routes: [{ name: 'Setup' }] });
          }}
        />
      }
    >
      <View style={styles.card}>
        <Animated.Text entering={rise(0)} style={typography.title}>
          {t.welcome.title}
        </Animated.Text>
        <Animated.View entering={rise(1)}>
          <AppText variant="body" style={styles.body}>
            {t.welcome.body}
          </AppText>
        </Animated.View>
        <Animated.View entering={rise(2)} style={styles.name}>
          <AppText variant="eyebrow">{t.welcome.name}</AppText>
          <TextField
            testID="name-input"
            accessibilityLabel={t.welcome.name}
            placeholder={t.welcome.namePlaceholder}
            value={name}
            onChangeText={setName}
            maxLength={40}
          />
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
  body: {
    color: colors.textMuted,
  },
  name: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
