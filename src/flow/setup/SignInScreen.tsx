import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { OrbOverlay } from '../../components/OrbOverlay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SimpleScreen } from '../../components/SimpleScreen';
import { useBook } from '../../core/store';
import { useProfile, type Language } from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { auth } from '../../services/auth';
import { colors, fonts, layout, motion, radii, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { haptics } from '../../utils/haptics';

const RESEND_AFTER = 30;

/** 9876543210 → "98765 43210". */
const spaced = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d);

/**
 * Language, number, code. Nothing else: no name, no email, no password.
 * A number that already has an Action Book goes straight to Home.
 */
export function SignInScreen({ navigation }: RootScreenProps<'SignIn'>) {
  const t = useT();
  const language = useProfile(s => s.language);
  const setLanguage = useProfile(s => s.setLanguage);
  const signIn = useProfile(s => s.signIn);
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<'sending' | 'checking' | null>(null);
  const [wrong, setWrong] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (!wait) {
      return;
    }
    const id = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const send = async () => {
    setBusy('sending');
    await auth.sendCode(`91${digits}`);
    setBusy(null);
    setSent(true);
    setWait(RESEND_AFTER);
    setTimeout(() => codeRef.current?.focus(), 200);
  };

  const verify = async (value = code) => {
    setBusy('checking');
    const ok = await auth.verify(`91${digits}`, value);
    setBusy(null);
    if (!ok) {
      haptics.warning();
      setWrong(true);
      return;
    }
    haptics.success();
    signIn({ method: 'phone', phone: `91${digits}` }, now().toISOString());
    const returning = useBook.getState().setup === 'done';
    navigation.reset({
      index: 0,
      routes: [{ name: returning ? 'Home' : 'Welcome' }],
    });
  };

  return (
    <>
      <SimpleScreen
        testID="sign-in"
        hideBack
        onBack={() => {}}
        art={art.ridge}
        footer={
          sent ? (
            <PrimaryButton
              testID="verify"
              label={t.signIn.verify}
              disabled={code.length !== 6 || busy !== null}
              onPress={() => verify()}
            />
          ) : (
            <PrimaryButton
              testID="send-code"
              label={t.signIn.send}
              disabled={digits.length !== 10 || busy !== null}
              onPress={send}
            />
          )
        }
      >
        <QuestionHeader
          eyebrow={t.signIn.eyebrow}
          title={sent ? t.signIn.codeTitle : t.signIn.title}
          subtitle={sent ? t.signIn.codeSent(spaced(digits)) : t.signIn.sub}
        />
        <QuestionBody gap={24}>
          {!sent ? (
            <View style={styles.group}>
              <AppText variant="eyebrow">{t.signIn.language}</AppText>
              <SegmentedControl<Language>
                testIDPrefix="language"
                value={language}
                segments={[
                  { id: 'en', label: 'English' },
                  { id: 'hi', label: 'हिंदी' },
                ]}
                onChange={setLanguage}
              />
            </View>
          ) : null}

          {!sent ? (
            <Animated.View entering={FadeIn.duration(motion.base)} style={styles.row}>
              <View style={styles.cc}>
                <AppText variant="body">+91</AppText>
              </View>
              <View style={[styles.field, digits ? styles.active : null]}>
                <TextInput
                  testID="phone-input"
                  accessibilityLabel={t.signIn.phone}
                  value={spaced(digits)}
                  onChangeText={v => setDigits(v.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textGhost}
                  selectionColor={colors.saffron}
                  cursorColor={colors.saffron}
                  style={[typography.heading, styles.input]}
                  onSubmitEditing={() => digits.length === 10 && send()}
                />
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(motion.base)} style={styles.group}>
              <View style={[styles.field, (code || wrong) && styles.active, wrong && styles.error]}>
                <TextInput
                  ref={codeRef}
                  testID="code-input"
                  accessibilityLabel={t.signIn.codeTitle}
                  value={code}
                  onChangeText={v => {
                    const next = v.replace(/\D/g, '').slice(0, 6);
                    setWrong(false);
                    setCode(next);
                    if (next.length === 6) {
                      verify(next);
                    }
                  }}
                  keyboardType="number-pad"
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  placeholder="••••••"
                  placeholderTextColor={colors.textGhost}
                  selectionColor={colors.saffron}
                  style={[typography.heading, styles.input, styles.code]}
                />
              </View>
              {wrong ? (
                <AppText variant="caption" style={styles.wrong}>
                  {t.signIn.wrong}
                </AppText>
              ) : null}
              <View style={styles.links}>
                <Pressable
                  testID="resend"
                  accessibilityRole="button"
                  disabled={wait > 0}
                  onPress={send}
                  hitSlop={8}
                >
                  <AppText variant="label" style={wait ? styles.muted : styles.saffron}>
                    {wait ? t.signIn.resendIn(wait) : t.signIn.resend}
                  </AppText>
                </Pressable>
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
                    {t.signIn.change}
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
    gap: spacing.md,
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
  },
  error: {
    borderColor: colors.danger,
  },
  input: {
    padding: 0,
    fontSize: 18,
    fontFamily: fonts.sansMedium,
  },
  code: {
    letterSpacing: 8,
  },
  wrong: {
    color: colors.danger,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  muted: {
    color: colors.textMuted,
  },
  saffron: {
    color: colors.saffron,
  },
});
