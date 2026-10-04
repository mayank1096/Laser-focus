import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { SimpleScreen } from '../../../components/SimpleScreen';
import type { RootScreenProps } from '../../../navigation/types';
import { auth } from '../../../services/auth';
import { colors, radii, spacing, typography } from '../../../theme';
import { now } from '../../../utils/clock';
import { haptics } from '../../../utils/haptics';
import { useProfile } from '../store';
import { formatIndianNumber } from './PhoneScreen';

const LENGTH = 6;
const RESEND_AFTER = 30;

export function CodeScreen({ navigation, route }: RootScreenProps<'Code'>) {
  const { mode, phone } = route.params;
  const signIn = useProfile(s => s.signIn);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [wait, setWait] = useState(RESEND_AFTER);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const shake = useSharedValue(0);

  useEffect(() => {
    const t = setInterval(() => setWait(w => Math.max(0, w - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const verify = async (value: string) => {
    setChecking(true);
    const ok = await auth.verify(`91${phone}`, value);
    setChecking(false);
    if (!ok) {
      setWrong(true);
      haptics.warning();
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      return;
    }
    haptics.success();
    signIn({ method: 'phone', phone: `91${phone}` }, now().toISOString());
    navigation.reset({
      index: 0,
      routes: [{ name: mode === 'signin' ? 'WelcomeBack' : 'Path' }],
    });
  };

  const onChange = (t: string) => {
    const next = t.replace(/\D/g, '').slice(0, LENGTH);
    setWrong(false);
    setCode(next);
    if (next.length === LENGTH) {
      verify(next);
    }
  };

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <SimpleScreen
      testID="code"
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="verify"
          label={checking ? 'Checking…' : 'Verify'}
          disabled={code.length < LENGTH || checking}
          onPress={() => verify(code)}
        />
      }
    >
      <QuestionHeader
        eyebrow="Sign in"
        title="Enter the code"
        subtitle={`Sent to +91 ${formatIndianNumber(phone)}`}
      />
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <AppText variant="label" style={styles.change}>
          Change number
        </AppText>
      </Pressable>
      <QuestionBody gap={24}>
        <Pressable onPress={() => input.current?.focus()} accessible={false}>
          <Animated.View style={[styles.boxes, rowStyle]}>
            {Array.from({ length: LENGTH }, (_, i) => {
              const filled = i < code.length;
              const current = i === code.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.box,
                    current && styles.current,
                    wrong && styles.wrong,
                  ]}
                >
                  <AppText variant="heading">{filled ? code[i] : ''}</AppText>
                </View>
              );
            })}
          </Animated.View>
        </Pressable>
        <TextInput
          ref={input}
          testID="code-input"
          accessibilityLabel="6-digit code"
          value={code}
          onChangeText={onChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={LENGTH}
          caretHidden
          style={styles.hidden}
        />
        <View style={styles.meta}>
          <AppText variant="caption">
            {wrong
              ? 'That code didn’t match. Try again.'
              : 'Reading your messages…'}
          </AppText>
          <Pressable
            testID="resend"
            disabled={wait > 0}
            onPress={() => {
              auth.sendCode(`91${phone}`);
              setWait(RESEND_AFTER);
            }}
          >
            <AppText variant="caption" style={wait > 0 ? null : styles.resend}>
              {wait > 0
                ? `Resend in 0:${String(wait).padStart(2, '0')}`
                : 'Resend code'}
            </AppText>
          </Pressable>
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  change: {
    marginTop: spacing.sm,
    color: colors.saffron,
  },
  boxes: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    flex: 1,
    aspectRatio: 0.88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  current: {
    borderColor: colors.saffron,
    boxShadow: `0px 0px 6px ${colors.saffronGlow}`,
  },
  wrong: {
    borderColor: colors.danger,
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  meta: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resend: {
    ...typography.caption,
    color: colors.saffron,
  },
});
