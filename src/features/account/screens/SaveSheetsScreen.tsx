import { OrbOverlay } from '../../../components/OrbOverlay';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { art } from '../../../assets/art';
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
import { useProfile, type SignInMethod } from '../store';

/** The illustration's own sky and mist, so it bleeds into the screen. */
const MIST = '#FEEDEA';
/** The illustration is 941 × 1672. */
const ART_RATIO = 1672 / 941;

/**
 * Asked right after the sheets are written. The warrior on the ridge, one
 * line above him, and the ways to sign in resting in the mist below.
 */
export function SaveSheetsScreen({
  navigation,
}: RootScreenProps<'SaveSheets'>) {
  const insets = useSafeAreaInsets();
  const signIn = useProfile(s => s.signIn);
  const [busy, setBusy] = useState<SignInMethod | null>(null);
  const [width, setWidth] = useState(0);

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
    <View
      testID="save-sheets"
      style={styles.screen}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
    >
      {width ? (
        <Animated.View
          entering={FadeIn.duration(motion.slow)}
          pointerEvents="none"
          style={[styles.art, { top: insets.top + 36 }]}
        >
          <Image
            source={art.ridge}
            style={{ width, height: width * ART_RATIO }}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      ) : null}

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="back-button"
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <ChevronLeft width={22} height={22} color={colors.ink} />
        </Pressable>
        <Animated.Text
          entering={FadeInDown.delay(200).duration(motion.slow)}
          style={styles.line}
          accessibilityRole="header"
        >
          A warrior never leaves his bow behind.
        </Animated.Text>
      </View>

      <Animated.View
        entering={FadeInDown.delay(400).duration(motion.slow)}
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <PrimaryButton
          testID="auth-phone"
          label="Continue with phone"
          onPress={() => navigation.navigate('Phone', { mode: 'signup' })}
        />
        <View style={styles.pair}>
          <OutlineButton
            testID="auth-google"
            style={styles.half}
            label={busy === 'google' ? 'Connecting…' : 'Google'}
            icon={<Google width={18} height={18} />}
            onPress={() => social('google')}
          />
          <OutlineButton
            testID="auth-apple"
            style={styles.half}
            label={busy === 'apple' ? 'Connecting…' : 'Apple'}
            icon={<Apple width={18} height={18} color={colors.ink} />}
            onPress={() => social('apple')}
          />
        </View>
        <AppText variant="micro" style={styles.private}>
          Sign in to keep your sheets safe. We never post anything.
        </AppText>
      </Animated.View>
      <OrbOverlay
        visible={busy !== null}
        label={`Connecting to ${busy === 'apple' ? 'Apple' : 'Google'}…`}
        state="connecting"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MIST,
  },
  art: {
    position: 'absolute',
    left: 0,
    right: 0,
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
  line: {
    ...typography.title,
    marginTop: spacing.xs,
    fontSize: 26,
    lineHeight: 31,
    color: colors.ink,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
    color: colors.textMuted,
  },
});
