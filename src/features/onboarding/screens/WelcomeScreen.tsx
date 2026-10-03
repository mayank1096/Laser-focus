import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../../components/PrimaryButton';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, layout, motion, spacing, typography } from '../../../theme';
import { rise } from '../components/QuestionHeader';

const logo = require('../../../assets/images/logo.png');
const hero = require('../../../assets/images/welcome-hero.jpg');

/** Figma geometry for the hero (402pt-wide frame). */
const HERO = { height: 536, bottom: 92, fadeHeight: 299 };
const LOGO = { width: 82, height: 79 };

export function WelcomeScreen({ navigation }: RootScreenProps<'Welcome'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = width / layout.designWidth;

  return (
    <View style={styles.screen}>
      <Animated.Image
        source={hero}
        resizeMode="cover"
        entering={FadeInDown.withInitialValues({
          opacity: 0,
          transform: [{ translateY: 40 }],
        })
          .delay(200)
          .duration(1400)
          .easing(motion.easeOut)}
        style={[
          styles.hero,
          { height: HERO.height * scale, bottom: HERO.bottom * scale },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        entering={FadeIn.duration(motion.slow)}
        style={[styles.fade, { height: HERO.fadeHeight * scale }]}
      />

      <View style={[styles.intro, { paddingTop: insets.top + 1 }]}>
        <Animated.View
          entering={ZoomIn.delay(100)
            .duration(motion.slow)
            .easing(motion.easeOut)}
          style={styles.logo}
        >
          <Image
            source={logo}
            style={styles.logoImage}
            accessibilityLabel="Laser Focus"
          />
        </Animated.View>

        <View style={styles.copy}>
          <View style={styles.titleGroup}>
            <Animated.Text
              entering={rise(3)}
              style={[typography.sanskrit, styles.center]}
            >
              अवधानात् जायते सिद्धिः
            </Animated.Text>
            <Animated.Text
              entering={rise(4)}
              style={[typography.display, styles.center]}
              accessibilityRole="header"
            >
              Laser Focus
            </Animated.Text>
          </View>
          <Animated.Text
            entering={rise(5)}
            style={[typography.body, styles.center]}
          >
            This app will not motivate you every morning. It will hold you to
            what you decide today.
          </Animated.Text>
        </View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(900)
          .duration(motion.slow)
          .easing(motion.easeOut)}
        style={[styles.footer, { paddingBottom: insets.bottom + 32 }]}
      >
        <PrimaryButton
          testID="welcome-start"
          label="Let’s conquer the world"
          shadow="dark"
          onPress={() => navigation.navigate('GoalSetup')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `linear-gradient(180deg, ${colors.sandClear} 14.194%, ${colors.white} 42.442%)`,
  },
  intro: {
    alignItems: 'center',
    gap: 36,
  },
  logo: {
    width: LOGO.width,
    height: LOGO.height,
    borderRadius: 51,
    overflow: 'hidden',
  },
  // The logo file is a sprite; Figma crops the first mark out of it.
  logoImage: {
    position: 'absolute',
    left: 0,
    top: LOGO.height * -0.0283,
    width: LOGO.width * 3.6076,
    height: LOGO.height * 1.0588,
  },
  copy: {
    width: 308,
    gap: 14,
  },
  titleGroup: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  center: {
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.gutter,
  },
});
