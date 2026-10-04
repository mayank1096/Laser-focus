import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Apple from '../../../assets/icons/apple.svg';
import Google from '../../../assets/icons/google.svg';
import { AppText } from '../../../components/AppText';
import {
  OutlineButton,
  PrimaryButton,
} from '../../../components/PrimaryButton';
import { QuestionHeader } from '../../../components/QuestionHeader';
import { SimpleScreen } from '../../../components/SimpleScreen';
import type { RootScreenProps } from '../../../navigation/types';
import { auth } from '../../../services/auth';
import { colors, motion, spacing } from '../../../theme';
import { now } from '../../../utils/clock';
import { haptics } from '../../../utils/haptics';
import { useGoalSetup } from '../../onboarding/store';
import { useProfile, type SignInMethod } from '../store';

/**
 * Asked right after the sheets are written, when they finally mean
 * something: sign in so a lost phone never takes them away.
 */
export function SaveSheetsScreen({
  navigation,
}: RootScreenProps<'SaveSheets'>) {
  const { values, goals, antiGoals } = useGoalSetup();
  const signIn = useProfile(s => s.signIn);
  const [busy, setBusy] = useState<SignInMethod | null>(null);
  const primary = goals.find(g => g.isPrimary);

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

  const cards = [
    {
      title: 'Anti-goals',
      meta: `${antiGoals.length} regrets · read when you don’t feel like it`,
      tint: colors.blush,
      rotate: '-2.5deg',
    },
    {
      title: 'Goals',
      meta: `${goals.length} ${goals.length === 1 ? 'goal' : 'goals'} · ${
        primary?.text ?? ''
      }`,
      tint: colors.parchment,
      rotate: '1.5deg',
    },
    {
      title: 'Values',
      meta: `${values.length} lines · once in a lifetime`,
      tint: colors.white,
      rotate: '-0.5deg',
    },
  ];

  return (
    <SimpleScreen
      testID="save-sheets"
      onBack={() => navigation.goBack()}
      footer={
        <>
          <PrimaryButton
            testID="auth-phone"
            label="Continue with phone"
            onPress={() => navigation.navigate('Phone', { mode: 'signup' })}
          />
          <OutlineButton
            testID="auth-google"
            label={busy === 'google' ? 'Connecting…' : 'Continue with Google'}
            icon={<Google width={18} height={18} />}
            onPress={() => social('google')}
          />
          <OutlineButton
            testID="auth-apple"
            label={busy === 'apple' ? 'Connecting…' : 'Continue with Apple'}
            icon={<Apple width={18} height={18} color={colors.ink} />}
            onPress={() => social('apple')}
          />
          <AppText variant="micro" style={styles.private}>
            Private. We never post anything for you.
          </AppText>
        </>
      }
    >
      <QuestionHeader
        eyebrow="Keep them safe"
        title="Your sheets live only on this phone."
        subtitle="Sign in so a lost phone never takes your values, goals and streak with it."
      />
      <View style={styles.stack}>
        {cards.map((c, i) => (
          <Animated.View
            key={c.title}
            entering={FadeInDown.delay(300 + i * 120)
              .duration(motion.slow)
              .easing(motion.easeOut)}
            style={i > 0 && styles.overlap}
          >
            <View
              style={[
                styles.card,
                { backgroundColor: c.tint, transform: [{ rotate: c.rotate }] },
              ]}
            >
              <AppText variant="heading" style={styles.cardTitle}>
                {c.title}
              </AppText>
              <AppText variant="micro" style={styles.meta} numberOfLines={1}>
                {c.meta}
              </AppText>
            </View>
          </Animated.View>
        ))}
      </View>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  stack: {
    marginTop: 36,
    paddingHorizontal: spacing.lg,
  },
  card: {
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
    boxShadow: '0px 10px 24px rgba(0, 0, 0, 0.06)',
    gap: spacing.xs,
  },
  overlap: {
    marginTop: -14,
  },
  cardTitle: {
    fontSize: 17,
  },
  meta: {
    color: colors.textMuted,
  },
  private: {
    textAlign: 'center',
    color: colors.textFaint,
  },
});
