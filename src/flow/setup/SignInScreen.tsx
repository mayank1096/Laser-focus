import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { art } from '../../assets/art';
import Apple from '../../assets/icons/apple.svg';
import Google from '../../assets/icons/google.svg';
import { AppText } from '../../components/AppText';
import { OrbOverlay } from '../../components/OrbOverlay';
import { useBook } from '../../core/store';
import {
  useProfile,
  type Account,
  type Language,
  type SignInMethod,
} from '../../features/account/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { auth } from '../../services/auth';
import { colors, motion, springs, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { haptics } from '../../utils/haptics';

/** The illustration's own mist, so the art melts into the screen. */
const MIST = '#FEEDEA';
/** The illustration is 941 × 1672. */
const ART_RATIO = 1672 / 941;
/** How far the art sits above the top edge, so the warrior clears the copy. */
const ART_LIFT = 0.08;

type Nav = RootScreenProps<'SignIn'>['navigation'];

/** Saves the account, then opens Home for a returning book, else Welcome. */
export function finishSignIn(
  navigation: Pick<Nav, 'reset'>,
  account: Omit<Account, 'signedInAt'>,
) {
  haptics.success();
  useProfile.getState().signIn(account, now().toISOString());
  const returning = useBook.getState().setup === 'done';
  navigation.reset({
    index: 0,
    routes: [{ name: returning ? 'Home' : 'Welcome' }],
  });
}

/**
 * The first screen. The whole screen is the
 * painting: the warrior on the ridge at dawn, the mist below him rising
 * into the page, and the line and the ways to sign in resting in that mist.
 */
export function SignInScreen({ navigation }: RootScreenProps<'SignIn'>) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const language = useProfile(s => s.language);
  const setLanguage = useProfile(s => s.setLanguage);
  const [busy, setBusy] = useState<SignInMethod | null>(null);

  // The painting fills the screen however tall the phone is.
  const artHeight = Math.max(height * 1.04, width * ART_RATIO);
  const artWidth = artHeight / ART_RATIO;

  // It settles in slowly, as if the camera is still finding him.
  const settle = useSharedValue(0);
  useEffect(() => {
    settle.value = withTiming(1, { duration: 1800, easing: motion.easeOut });
  }, [settle]);
  const artStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, settle.value * 1.6),
    transform: [{ scale: 1.08 - settle.value * 0.08 }],
  }));

  const social = async (method: 'google' | 'apple') => {
    if (busy) {
      return;
    }
    setBusy(method);
    const { email } = await (method === 'google'
      ? auth.google()
      : auth.apple());
    setBusy(null);
    finishSignIn(navigation, { method, email });
  };

  const rise = (step: number) =>
    FadeInDown.delay(500 + step * 110)
      .duration(motion.slow + 120)
      .easing(motion.easeOut);

  return (
    <View testID="sign-in" style={styles.screen}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.art,
          { top: -height * ART_LIFT, left: (width - artWidth) / 2 },
          artStyle,
        ]}
      >
        <Image
          source={art.ridge}
          style={{ width: artWidth, height: artHeight }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>

      {/* The mist thickens toward the bottom so the copy always reads. */}
      <Svg
        pointerEvents="none"
        style={styles.mist}
        width={width}
        height={height * 0.6}
      >
        <Defs>
          <LinearGradient id="save-mist" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={MIST} stopOpacity="0" />
            <Stop offset="0.3" stopColor={MIST} stopOpacity="0.7" />
            <Stop offset="0.5" stopColor={MIST} stopOpacity="1" />
            <Stop offset="1" stopColor={MIST} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height * 0.6} fill="url(#save-mist)" />
      </Svg>

      <View style={[styles.bar, { top: insets.top + spacing.sm }]}>
        <LanguagePill value={language} onChange={setLanguage} />
      </View>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <Animated.Text
          entering={rise(0)}
          style={[styles.eyebrow, language === 'hi' && styles.noTracking]}
        >
          {t.signIn.eyebrow}
        </Animated.Text>
        <Animated.Text
          entering={rise(1)}
          style={styles.line}
          accessibilityRole="header"
        >
          {t.signIn.line}
        </Animated.Text>
        <Animated.Text entering={rise(2)} style={styles.sub}>
          {t.signIn.lineSub}
        </Animated.Text>

        <Animated.View entering={rise(3)} style={styles.actions}>
          <Choice
            testID="auth-phone"
            label={t.signIn.continuePhone}
            tone="dark"
            onPress={() => navigation.navigate('Contact', { via: 'phone' })}
          />
          <View style={styles.pair}>
            <Choice
              testID="auth-google"
              label={t.signIn.google}
              icon={<Google width={18} height={18} />}
              onPress={() => social('google')}
            />
            <Choice
              testID="auth-apple"
              label={t.signIn.apple}
              icon={<Apple width={18} height={18} color={colors.ink} />}
              onPress={() => social('apple')}
            />
          </View>
        </Animated.View>

        <Animated.View entering={rise(4)} style={styles.below}>
          <Pressable
            testID="auth-email"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              haptics.tap();
              navigation.navigate('Contact', { via: 'email' });
            }}
          >
            <AppText variant="label" style={styles.email}>
              {t.signIn.useEmail}
            </AppText>
          </Pressable>
          <AppText variant="micro" style={styles.private}>
            {t.signIn.private}
          </AppText>
        </Animated.View>
      </View>

      <OrbOverlay
        visible={busy !== null}
        label={t.signIn.connecting(
          busy === 'apple' ? t.signIn.apple : t.signIn.google,
        )}
        state="connecting"
      />
    </View>
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
    <View style={styles.lang} accessibilityRole="radiogroup">
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
            style={[styles.langOption, on && styles.langOn]}
          >
            <AppText
              variant="label"
              style={on ? styles.langTextOn : styles.langText}
            >
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A soft pill: dark for the main way in, frosted glass for the others. */
function Choice({
  label,
  onPress,
  icon,
  tone = 'glass',
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  tone?: 'dark' | 'glass';
  testID?: string;
}) {
  const dark = tone === 'dark';
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={dark ? null : styles.half}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97, springs.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
    >
      <Animated.View
        style={[
          styles.pill,
          dark ? styles.pillDark : styles.pillGlass,
          pressStyle,
        ]}
      >
        {icon}
        <Text
          numberOfLines={1}
          style={[
            typography.button,
            { color: dark ? colors.white : colors.ink },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MIST,
    overflow: 'hidden',
  },
  art: {
    position: 'absolute',
  },
  mist: {
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  bar: {
    position: 'absolute',
    left: spacing.gutter,
    right: spacing.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lang: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(80, 40, 20, 0.12)',
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  langOn: {
    backgroundColor: colors.ink,
  },
  langText: {
    color: colors.textMuted,
  },
  langTextOn: {
    color: colors.white,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.gutter,
    alignItems: 'center',
  },
  noTracking: {
    letterSpacing: 0,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: '#B4612A',
  },
  line: {
    ...typography.title,
    lineHeight: 34,
    maxWidth: 340,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  sub: {
    ...typography.body,
    maxWidth: 320,
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.textMuted,
  },
  actions: {
    alignSelf: 'stretch',
    marginTop: 28,
    gap: 10,
  },
  pair: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  pill: {
    height: 54,
    borderRadius: 27,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  pillDark: {
    backgroundColor: colors.charcoal,
    boxShadow: '0px 12px 24px rgba(60, 24, 6, 0.18)',
  },
  pillGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(80, 40, 20, 0.12)',
  },
  below: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  email: {
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  private: {
    textAlign: 'center',
    color: colors.textMuted,
  },
});
