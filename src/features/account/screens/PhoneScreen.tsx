import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { SimpleScreen } from '../../../components/SimpleScreen';
import type { RootScreenProps } from '../../../navigation/types';
import { auth } from '../../../services/auth';
import {
  colors,
  fonts,
  layout,
  radii,
  spacing,
  typography,
} from '../../../theme';

/** 9876543210 → "98765 43210". */
export const formatIndianNumber = (digits: string) =>
  digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;

export function PhoneScreen({ navigation, route }: RootScreenProps<'Phone'>) {
  const { mode } = route.params;
  const [digits, setDigits] = useState('');
  const [sending, setSending] = useState(false);
  const ready = digits.length === 10;

  const send = async () => {
    setSending(true);
    await auth.sendCode(`91${digits}`);
    setSending(false);
    navigation.navigate('Code', { mode, phone: digits });
  };

  return (
    <SimpleScreen
      testID="phone"
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="send-code"
          label={sending ? 'Sending…' : 'Send code'}
          disabled={!ready || sending}
          onPress={send}
        />
      }
    >
      <QuestionHeader
        eyebrow={mode === 'signin' ? 'Welcome back' : 'Sign in'}
        title="Your phone number"
        subtitle="We’ll text you a 6-digit code. No calls, no spam."
      />
      <QuestionBody gap={28}>
        <View style={styles.row}>
          <View style={styles.code}>
            <AppText variant="body">+91</AppText>
          </View>
          <View style={[styles.field, digits ? styles.active : null]}>
            <TextInput
              testID="phone-input"
              accessibilityLabel="Phone number"
              value={formatIndianNumber(digits)}
              onChangeText={t => setDigits(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              autoFocus
              placeholder="98765 43210"
              placeholderTextColor={colors.textGhost}
              selectionColor={colors.saffron}
              cursorColor={colors.saffron}
              style={[typography.heading, styles.input, styles.digits]}
              onSubmitEditing={() => ready && send()}
            />
          </View>
        </View>
        <AppText variant="caption" style={styles.hint}>
          Use the number on this phone so the code fills in by itself.
        </AppText>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  digits: {
    fontFamily: fonts.sansMedium,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  code: {
    height: layout.fieldHeight + 4,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderRadius: radii.field,
    backgroundColor: colors.stone,
  },
  field: {
    flex: 1,
    height: layout.fieldHeight + 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  active: {
    borderColor: colors.saffron,
    boxShadow: `0px 0px 6px ${colors.saffronGlow}`,
  },
  input: {
    padding: 0,
    fontSize: 18,
  },
  hint: {
    marginTop: spacing.lg,
  },
});
