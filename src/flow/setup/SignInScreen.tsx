import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { OrbOverlay } from '../../components/OrbOverlay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { rise } from '../../components/QuestionHeader';
import { useBook } from '../../core/store';
import { useProfile, type Language } from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { auth } from '../../services/auth';
import { colors, fonts, motion, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { haptics } from '../../utils/haptics';

const RESEND_AFTER = 30;
const CODE_LENGTH = 6;
/** The painting's own sky and mist, so its edges melt into the screen. */
const SKY = '#FEECEA';
/** The painting is 941 × 1672; the warrior sits a little below its top. */
const ART_RATIO = 1672 / 941;
const ART_DROP = 0.1;

/** 9876543210 → "98765 43210". */
const spaced = (d: string) =>
  d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d;

/**
 * The warrior on the ridge fills the screen; the title sits in his sky and
 * a frosted card rests in the mist below. Language, number, code — nothing
 * else. A number that already has an Action Book goes straight to Home.
 */
export function SignInScreen({ navigation }: RootScreenProps<'SignIn'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const language = useProfile(s => s.language);
  const setLanguage = useProfile(s => s.setLanguage);
  const signIn = useProfile(s => s.signIn);
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState<'sending' | 'checking' | null>(null);
  const [wrong, setWrong] = useState(false);
  const [wait, setWait] = useState(0);
  const [focused, setFocused] = useState(false);
  const codeRef = useRef<React.ComponentRef<typeof TextInput>>(null);

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

  // Cover the screen's width, and drop the painting a touch so the title
  // has clear sky above the warrior.
  const artWidth = Math.max(width, height / ART_RATIO);
  const artHeight = artWidth * ART_RATIO;

  return (
    <>
      <View testID="sign-in" style={styles.screen}>
        <Image
          source={art.ridge}
          resizeMode="cover"
          style={[
            styles.art,
            {
              width: artWidth,
              height: artHeight,
              left: (width - artWidth) / 2,
              top: height * ART_DROP,
            },
          ]}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.fill}
        >
          <View style={[styles.top, { paddingTop: insets.top + spacing.lg }]}>
            <Animated.View entering={rise(0)} style={styles.bar}>
              <AppText variant="eyebrow" style={styles.brand}>
                {t.signIn.eyebrow}
              </AppText>
              <LanguagePill value={language} onChange={setLanguage} />
            </Animated.View>
            <Animated.Text
              key={sent ? 'code' : 'phone'}
              entering={rise(1)}
              style={styles.title}
              accessibilityRole="header"
            >
              {sent ? t.signIn.codeTitle : t.signIn.title}
            </Animated.Text>
            <Animated.View entering={rise(2)}>
              <AppText variant="body" style={styles.sub}>
                {sent ? t.signIn.codeSent(spaced(digits)) : t.signIn.sub}
              </AppText>
            </Animated.View>
          </View>

          <Animated.View
            entering={FadeInDown.delay(240)
              .duration(motion.slow)
              .easing(motion.easeOut)}
            style={[styles.card, { marginBottom: insets.bottom + 20 }]}
          >
            {!sent ? (
              <Animated.View
                key="phone"
                entering={FadeIn.duration(motion.base)}
                style={styles.cardBody}
              >
                <AppText variant="eyebrow">{t.signIn.phone}</AppText>
                <View
                  style={[
                    styles.field,
                    (focused || digits) && styles.fieldActive,
                  ]}
                >
                  <AppText style={styles.cc}>+91</AppText>
                  <View style={styles.rule} />
                  <TextInput
                    testID="phone-input"
                    accessibilityLabel={t.signIn.phone}
                    value={spaced(digits)}
                    onChangeText={v =>
                      setDigits(v.replace(/\D/g, '').slice(0, 10))
                    }
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    keyboardType="number-pad"
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textGhost}
                    selectionColor={colors.saffron}
                    cursorColor={colors.saffron}
                    style={styles.number}
                    onSubmitEditing={() => digits.length === 10 && send()}
                  />
                </View>
                <PrimaryButton
                  testID="send-code"
                  label={t.signIn.send}
                  disabled={digits.length !== 10 || busy !== null}
                  onPress={send}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="code"
                entering={FadeIn.duration(motion.base)}
                style={styles.cardBody}
              >
                <Pressable
                  accessibilityRole="none"
                  onPress={() => codeRef.current?.focus()}
                  style={styles.cells}
                >
                  {Array.from({ length: CODE_LENGTH }, (_, i) => {
                    const filled = i < code.length;
                    const current = i === code.length && !wrong;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.cell,
                          filled && styles.cellFilled,
                          current && styles.cellCurrent,
                          wrong && styles.cellWrong,
                        ]}
                      >
                        <AppText style={styles.cellText}>
                          {code[i] ?? ''}
                        </AppText>
                      </View>
                    );
                  })}
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
                    autoComplete="sms-otp"
                    caretHidden
                    style={styles.hiddenInput}
                  />
                </Pressable>
                {wrong ? (
                  <AppText variant="caption" style={styles.wrong}>
                    {t.signIn.wrong}
                  </AppText>
                ) : null}
                <PrimaryButton
                  testID="verify"
                  label={t.signIn.verify}
                  disabled={code.length !== CODE_LENGTH || busy !== null}
                  onPress={() => verify()}
                />
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
                      {t.signIn.change}
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
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
      <OrbOverlay
        visible={busy !== null}
        label={busy === 'sending' ? t.signIn.sending : t.signIn.checking}
        state="connecting"
      />
    </>
  );
}

/** English or हिंदी, as a small glass pill in the corner. */
function LanguagePill({
  value,
  onChange,
}: {
  value: Language;
  onChange: (l: Language) => void;
}) {
  const options: { id: Language; label: string }[] = [
    { id: 'en', label: 'EN' },
    { id: 'hi', label: 'हिंदी' },
  ];
  return (
    <View style={styles.pill} accessibilityRole="radiogroup">
      {options.map(o => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            testID={`language-${o.id}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            hitSlop={6}
            onPress={() => {
              if (!on) {
                haptics.selection();
                onChange(o.id);
              }
            }}
            style={[styles.pillOption, on && styles.pillOn]}
          >
            <AppText
              variant="label"
              style={on ? styles.pillTextOn : styles.pillText}
            >
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SKY,
    overflow: 'hidden',
  },
  art: {
    position: 'absolute',
  },
  fill: {
    flex: 1,
    justifyContent: 'space-between',
  },
  top: {
    paddingHorizontal: spacing.gutter,
    gap: spacing.md,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  brand: {
    color: colors.ink,
  },
  title: {
    ...typography.display,
    fontSize: 36,
    lineHeight: 40,
    color: colors.ink,
    maxWidth: 320,
  },
  sub: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  pill: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  pillOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillOn: {
    backgroundColor: colors.ink,
  },
  pillText: {
    color: colors.textMuted,
  },
  pillTextOn: {
    color: colors.white,
  },
  card: {
    marginHorizontal: spacing.gutter - 6,
    padding: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    boxShadow: '0px 24px 48px rgba(122, 52, 12, 0.16)',
  },
  cardBody: {
    gap: 14,
  },
  field: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  fieldActive: {
    borderColor: colors.saffron,
  },
  cc: {
    fontFamily: fonts.sansMedium,
    fontSize: 18,
    color: colors.ink,
  },
  rule: {
    width: 1,
    height: 24,
    marginHorizontal: 14,
    backgroundColor: colors.hairline,
  },
  number: {
    flex: 1,
    padding: 0,
    fontFamily: fonts.sansMedium,
    fontSize: 20,
    letterSpacing: 0.5,
    color: colors.ink,
  },
  cells: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  cellFilled: {
    borderColor: colors.ink,
  },
  cellCurrent: {
    borderColor: colors.saffron,
  },
  cellWrong: {
    borderColor: colors.danger,
  },
  cellText: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
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
    paddingHorizontal: 4,
  },
  muted: {
    color: colors.textMuted,
  },
  saffron: {
    color: colors.saffron,
  },
});
