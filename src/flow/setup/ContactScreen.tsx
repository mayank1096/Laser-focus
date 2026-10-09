import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../components/AppText';
import { OrbOverlay } from '../../components/OrbOverlay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { auth } from '../../services/auth';
import { colors, fonts, layout, motion, radii, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { finishSignIn } from './SignInScreen';

const RESEND_AFTER = 30;
const CODE_LENGTH = 6;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 9876543210 → "98765 43210". */
const spaced = (d: string) =>
  d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;

/** A phone number or an email, then the six-digit code sent to it. */
export function ContactScreen({
  navigation,
  route,
}: RootScreenProps<'Contact'>) {
  const t = useT();
  const { via } = route.params;
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<'sending' | 'checking' | null>(null);
  const [wrong, setWrong] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const phone = via === 'phone';
  const to = phone ? `91${value}` : value.trim().toLowerCase();
  const ready = phone ? value.length === 10 : EMAIL.test(value.trim());

  useEffect(() => {
    if (!wait) {
      return;
    }
    const id = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const send = async () => {
    haptics.tap();
    setBusy('sending');
    await auth.sendCode(to);
    setBusy(null);
    setSent(true);
    setWait(RESEND_AFTER);
    setTimeout(() => codeRef.current?.focus(), 200);
  };

  const verify = async (entered = code) => {
    setBusy('checking');
    const ok = await auth.verify(to, entered);
    setBusy(null);
    if (!ok) {
      haptics.warning();
      setWrong(true);
      return;
    }
    finishSignIn(
      navigation,
      phone ? { method: 'phone', phone: to } : { method: 'email', email: to },
    );
  };

  const title = sent
    ? t.signIn.codeTitle
    : phone
    ? t.signIn.phoneTitle
    : t.signIn.emailTitle;
  const subtitle = sent
    ? phone
      ? t.signIn.codeSent(spaced(value))
      : t.signIn.codeSentEmail(to)
    : phone
    ? t.signIn.phoneSub
    : t.signIn.emailSub;

  return (
    <>
      <SimpleScreen
        testID="contact"
        onBack={() => (sent ? setSent(false) : navigation.goBack())}
        footer={
          sent ? (
            <PrimaryButton
              testID="verify"
              label={t.signIn.verify}
              disabled={code.length !== CODE_LENGTH || busy !== null}
              onPress={() => verify()}
            />
          ) : (
            <PrimaryButton
              testID="send-code"
              label={t.signIn.send}
              disabled={!ready || busy !== null}
              onPress={send}
            />
          )
        }
      >
        <QuestionHeader
          eyebrow={t.signIn.eyebrow}
          title={title}
          subtitle={subtitle}
        />
        <QuestionBody gap={24}>
          {!sent ? (
            <Animated.View key="entry" entering={FadeIn.duration(motion.base)}>
              {phone ? (
                <View style={styles.row}>
                  <View style={styles.cc}>
                    <AppText variant="body">+91</AppText>
                  </View>
                  <View
                    style={[
                      styles.field,
                      styles.grow,
                      value ? styles.active : null,
                    ]}
                  >
                    <TextInput
                      testID="phone-input"
                      accessibilityLabel={t.signIn.phone}
                      value={spaced(value)}
                      onChangeText={v =>
                        setValue(v.replace(/\D/g, '').slice(0, 10))
                      }
                      keyboardType="number-pad"
                      textContentType="telephoneNumber"
                      autoComplete="tel"
                      autoFocus
                      placeholder="98765 43210"
                      placeholderTextColor={colors.textGhost}
                      selectionColor={colors.saffron}
                      cursorColor={colors.saffron}
                      style={styles.input}
                      onSubmitEditing={() => ready && send()}
                    />
                  </View>
                </View>
              ) : (
                <View style={[styles.field, value ? styles.active : null]}>
                  <TextInput
                    testID="email-input"
                    accessibilityLabel={t.signIn.email}
                    value={value}
                    onChangeText={v => setValue(v.replace(/\s/g, ''))}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    placeholder={t.signIn.emailPlaceholder}
                    placeholderTextColor={colors.textGhost}
                    selectionColor={colors.saffron}
                    cursorColor={colors.saffron}
                    style={styles.input}
                    onSubmitEditing={() => ready && send()}
                  />
                </View>
              )}
              {phone ? (
                <AppText variant="caption" style={styles.hint}>
                  {t.signIn.phoneHint}
                </AppText>
              ) : null}
            </Animated.View>
          ) : (
            <Animated.View
              key="code"
              entering={FadeIn.duration(motion.base)}
              style={styles.group}
            >
              <Pressable
                accessibilityRole="none"
                onPress={() => codeRef.current?.focus()}
                style={styles.cells}
              >
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.cell,
                      i < code.length && styles.cellFilled,
                      i === code.length && !wrong && styles.active,
                      wrong && styles.cellWrong,
                    ]}
                  >
                    <AppText style={styles.cellText}>{code[i] ?? ''}</AppText>
                  </View>
                ))}
                {/* The real input sits invisibly over the cells. */}
                <TextInput
                  ref={codeRef}
                  testID="code-input"
                  accessibilityLabel={t.signIn.codeTitle}
                  value={code}
                  onChangeText={v => {
                    const next = v.replace(/\D/g, '').slice(0, CODE_LENGTH);
                    setWrong(false);
                    setCode(next);
                    if (next.length === CODE_LENGTH) {
                      verify(next);
                    }
                  }}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete={phone ? 'sms-otp' : 'one-time-code'}
                  caretHidden
                  style={styles.hiddenInput}
                />
              </Pressable>
              {wrong ? (
                <AppText variant="caption" style={styles.wrong}>
                  {t.signIn.wrong}
                </AppText>
              ) : null}
              <View style={styles.links}>
                <Pressable
                  testID="change-number"
                  accessibilityRole="button"
                  onPress={() => {
                    setSent(false);
                    setCode('');
                    setWrong(false);
                  }}
                  hitSlop={8}
                >
                  <AppText variant="label" style={styles.muted}>
                    {phone ? t.signIn.change : t.signIn.changeEmail}
                  </AppText>
                </Pressable>
                <Pressable
                  testID="resend"
                  accessibilityRole="button"
                  disabled={wait > 0}
                  onPress={send}
                  hitSlop={8}
                >
                  <AppText
                    variant="label"
                    style={wait ? styles.muted : styles.saffron}
                  >
                    {wait ? t.signIn.resendIn(wait) : t.signIn.resend}
                  </AppText>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </QuestionBody>
      </SimpleScreen>
      <OrbOverlay
        visible={busy !== null}
        label={busy === 'sending' ? t.signIn.sending : t.signIn.checking}
        state="connecting"
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  cc: {
    height: layout.fieldHeight + 4,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    borderRadius: radii.field,
    backgroundColor: colors.stone,
  },
  field: {
    height: layout.fieldHeight + 4,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  grow: {
    flex: 1,
  },
  active: {
    borderColor: colors.saffron,
    boxShadow: `0px 0px 6px ${colors.saffronGlow}`,
  },
  input: {
    padding: 0,
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    color: colors.ink,
  },
  hint: {
    marginTop: spacing.lg,
  },
  cells: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: layout.fieldHeight + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  cellFilled: {
    borderColor: colors.ink,
  },
  cellWrong: {
    borderColor: colors.danger,
  },
  cellText: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: colors.ink,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.01,
    color: 'transparent',
  },
  wrong: {
    color: colors.danger,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  muted: {
    color: colors.textMuted,
  },
  saffron: {
    color: colors.saffron,
  },
});
