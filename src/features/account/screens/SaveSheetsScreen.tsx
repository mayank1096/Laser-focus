import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Apple from '../../../assets/icons/apple.svg';
import ChevronLeft from '../../../assets/icons/chevron-left.svg';
import Google from '../../../assets/icons/google.svg';
import { AppText } from '../../../components/AppText';
import {
  OutlineButton,
  PrimaryButton,
} from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { auth } from '../../../services/auth';
import { colors, motion, spacing, typography } from '../../../theme';
import { now } from '../../../utils/clock';
import { haptics } from '../../../utils/haptics';
import { useGoalSetup } from '../../onboarding/store';
import { useProfile, type SignInMethod } from '../store';
import { sansDigits } from '../../../components/Numerals';

const DIM = 'rgba(244, 238, 230, 0.56)';
const RULE = 'rgba(244, 238, 230, 0.12)';

const count = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * Asked right after the sheets are written, when they finally mean
 * something. Night, one lamp, and the first line the user wrote: the thing
 * that would be lost with the phone, shown back to them.
 */
export function SaveSheetsScreen({
  navigation,
}: RootScreenProps<'SaveSheets'>) {
  const insets = useSafeAreaInsets();
  const { values, goals, antiGoals } = useGoalSetup();
  const signIn = useProfile(s => s.signIn);
  const [busy, setBusy] = useState<SignInMethod | null>(null);
  const first = values[0]?.text;

  // The lamp breathes, slowly.
  const flicker = useSharedValue(0);
  useEffect(() => {
    flicker.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [flicker]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.75 + flicker.value * 0.25,
    transform: [{ scale: 0.96 + flicker.value * 0.06 }],
  }));

  const social = async (method: 'google' | 'apple') => {
    if (busy) {
      return;
    }
    setBusy(method);
    const { email } = await (method === 'google'
      ? auth.google()
      : auth.apple());
    signIn({ method, email }, now().toISOString());
    haptics.success();
    setBusy(null);
    navigation.reset({ index: 0, routes: [{ name: 'Path' }] });
  };

  return (
    <View testID="save-sheets" style={styles.screen}>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, { top: insets.top + 40 }, haloStyle]}
      >
        <Svg width={360} height={360}>
          <Defs>
            <RadialGradient id="lamp" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.saffron} stopOpacity="0.5" />
              <Stop offset="0.35" stopColor="#C2560A" stopOpacity="0.16" />
              <Stop offset="1" stopColor={colors.night} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={180} cy={180} r={180} fill="url(#lamp)" />
        </Svg>
      </Animated.View>

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <ChevronLeft width={22} height={22} color={colors.cream} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Animated.View
          entering={FadeIn.duration(motion.slow)}
          style={styles.flame}
        />
        <Animated.View
          entering={FadeIn.delay(200).duration(motion.slow)}
          style={styles.thread}
        />
        <Animated.Text
          entering={FadeInDown.delay(320).duration(motion.slow)}
          style={styles.quote}
          numberOfLines={3}
        >
          {sansDigits(
            first ? `“${first}”` : 'Your values, goals and anti-goals',
          )}
        </Animated.Text>
        {first ? (
          <Animated.Text
            entering={FadeIn.delay(520).duration(motion.slow)}
            style={styles.attribution}
          >
            the first line you wrote
          </Animated.Text>
        ) : null}
        <Animated.View
          entering={FadeIn.delay(680).duration(motion.slow)}
          style={styles.ledger}
        >
          <AppText variant="eyebrow" style={styles.ledgerText}>
            {[
              count(values.length, 'value', 'values'),
              count(goals.length, 'goal', 'goals'),
              count(antiGoals.length, 'anti-goal', 'anti-goals'),
            ].join('   ·   ')}
          </AppText>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(820).duration(motion.slow)}
        style={styles.copy}
      >
        <AppText variant="eyebrow" style={styles.eyebrow}>
          Keep them safe
        </AppText>
        <AppText variant="title" style={styles.title}>
          This lives only on this phone.
        </AppText>
        <AppText variant="body" style={styles.body}>
          Lose the phone and these sheets go with it. Sign in once and they
          follow you.
        </AppText>
      </Animated.View>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <PrimaryButton
          testID="auth-phone"
          tone="light"
          shadow="none"
          label="Continue with phone"
          onPress={() => navigation.navigate('Phone', { mode: 'signup' })}
        />
        <View style={styles.pair}>
          <OutlineButton
            testID="auth-google"
            onDark
            style={styles.half}
            label={busy === 'google' ? 'Connecting…' : 'Google'}
            icon={<Google width={18} height={18} />}
            onPress={() => social('google')}
          />
          <OutlineButton
            testID="auth-apple"
            onDark
            style={styles.half}
            label={busy === 'apple' ? 'Connecting…' : 'Apple'}
            icon={<Apple width={18} height={18} color={colors.cream} />}
            onPress={() => social('apple')}
          />
        </View>
        <AppText variant="micro" style={styles.private}>
          Private. We never post anything for you.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.night,
  },
  halo: {
    position: 'absolute',
    alignSelf: 'center',
  },
  top: {
    paddingHorizontal: spacing.gutter,
  },
  back: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginLeft: -10,
    paddingLeft: 10,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.gutter + spacing.lg,
    marginTop: 72,
  },
  flame: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.saffron,
    boxShadow: `0px 0px 18px ${colors.saffronGlow}`,
  },
  thread: {
    width: 1,
    height: 40,
    marginVertical: spacing.md,
    backgroundColor: 'rgba(250, 140, 34, 0.35)',
  },
  quote: {
    ...typography.title,
    fontSize: 26,
    lineHeight: 34,
    color: colors.cream,
    textAlign: 'center',
  },
  attribution: {
    ...typography.caption,
    fontFamily: typography.body.fontFamily,
    fontStyle: 'italic',
    color: DIM,
    marginTop: spacing.sm,
  },
  ledger: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: RULE,
  },
  ledgerText: {
    color: DIM,
  },
  copy: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.saffron,
  },
  title: {
    color: colors.cream,
  },
  body: {
    color: DIM,
  },
  footer: {
    paddingHorizontal: spacing.gutter,
    gap: spacing.md,
  },
  pair: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  half: {
    flex: 1,
  },
  private: {
    textAlign: 'center',
    color: 'rgba(244, 238, 230, 0.4)',
  },
});
