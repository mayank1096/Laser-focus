import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChevronLeft from '../assets/icons/chevron-left.svg';
import { colors, layout, motion, spacing } from '../theme';
import { IconButton } from './IconButton';
import { ProgressSegments } from './ProgressSegments';
import { StepArt, useArtSize } from './StepArt';
import { SurfaceContext } from './Surface';

export type FlowDirection = 'forward' | 'back';
export type FlowTone = 'light' | 'blush' | 'parchment';

export interface FlowFrameProps {
  /** Changes whenever the step changes; drives the slide animation. */
  stepKey: string;
  direction: FlowDirection;
  /** Segments in the progress bar. Omit to hide the bar. */
  progress?: {
    total: number;
    filled: number;
    onSegmentPress?: (index: number) => void;
  };
  /** Back arrow and Android back. */
  onBack: () => void;
  /** No way back, e.g. while locked out. */
  hideBack?: boolean;
  art?: ImageSourcePropType;
  tone?: FlowTone;
  /** The button(s) pinned to the bottom. */
  footer: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
}

/** The art's figures start roughly this far down the illustration. */
const ART_FIGURE_START = 0.42;
/** Height of the fade where scrolled content meets the header. */
const EDGE_FADE = 20;

const SURFACES: Record<FlowTone, string> = {
  light: colors.white,
  blush: colors.blush,
  parchment: colors.parchment,
};

/**
 * The frame every step-by-step flow uses: back arrow and progress bar on
 * top, an illustration anchored to the bottom and a button pinned below.
 * The question in the middle slides between steps; the frame stays put.
 */
export function FlowFrame({
  stepKey,
  direction,
  progress,
  onBack,
  hideBack = false,
  art,
  tone = 'light',
  footer,
  children,
  testID,
}: FlowFrameProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const artSize = useArtSize();
  const surface = SURFACES[tone];

  // Cross-fade the background from the previous tone to the new one.
  const fromColor = useSharedValue(surface);
  const toColor = useSharedValue(surface);
  const blend = useSharedValue(1);
  useEffect(() => {
    if (toColor.value === surface) {
      return;
    }
    fromColor.value = toColor.value;
    toColor.value = surface;
    blend.value = 0;
    blend.value = withTiming(1, { duration: motion.slow });
  }, [surface, fromColor, toColor, blend]);
  const backgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      blend.value,
      [0, 1],
      [fromColor.value, toColor.value],
    ),
  }));

  // Android back walks back through the steps first.
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBackRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  // Fade the art back once the content runs into it, and follow new lines
  // down a growing list.
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const contentTop = useRef(0);
  const lastHeight = useRef(0);
  const [artDimmed, setArtDimmed] = useState(false);
  useEffect(() => {
    lastHeight.current = 0;
  }, [stepKey]);

  // Only the current step may dim the art: the outgoing one keeps reporting
  // sizes while it animates away.
  const currentKey = useRef(stepKey);
  currentKey.current = stepKey;
  const onContentSize = (forKey: string) => (_: number, height: number) => {
    if (forKey !== currentKey.current) {
      return;
    }
    const artFigureTop = windowHeight - artSize * (1 - ART_FIGURE_START);
    const contentBottom = contentTop.current + height - spacing.xxl;
    setArtDimmed(contentBottom > artFigureTop);
    if (lastHeight.current > 0 && height > lastHeight.current) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
    lastHeight.current = height;
  };

  const entering = (direction === 'forward' ? FadeInRight : FadeInLeft)
    .duration(motion.base)
    .easing(motion.easeOut);
  const exiting = (
    direction === 'forward' ? FadeOutLeft : FadeOutRight
  ).duration(motion.fast);

  return (
    <SurfaceContext.Provider value={surface}>
      <Animated.View style={[styles.screen, backgroundStyle]} testID={testID}>
        {art ? (
          <StepArt source={art} artKey={`${art}`} dimmed={artDimmed} />
        ) : null}

        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.header,
              { paddingTop: insets.top + layout.progressOffset - 16 },
            ]}
          >
            {hideBack ? null : (
              <IconButton
                Icon={ChevronLeft}
                size={20}
                testID="back-button"
                accessibilityLabel="Back"
                onPress={onBack}
              />
            )}
            {progress ? (
              <View style={styles.progress}>
                <ProgressSegments {...progress} />
              </View>
            ) : null}
          </View>

          <View
            style={[styles.fill, styles.clip]}
            onLayout={e => {
              contentTop.current = e.nativeEvent.layout.y;
            }}
          >
            <Animated.View
              key={stepKey}
              entering={entering}
              exiting={exiting}
              style={StyleSheet.absoluteFill}
            >
              <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                onContentSizeChange={onContentSize(stepKey)}
              >
                {children}
              </ScrollView>
            </Animated.View>
            <View
              pointerEvents="none"
              style={[
                styles.edgeFade,
                {
                  backgroundImage: `linear-gradient(180deg, ${surface} 0%, ${surface}00 100%)`,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.footer,
              { paddingBottom: insets.bottom + layout.buttonBottom },
            ]}
          >
            {footer}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SurfaceContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // The back button's 36pt hit area hangs into the gutter.
    paddingLeft: spacing.gutter - 12,
    paddingRight: spacing.gutter,
    gap: spacing.xs,
    minHeight: 36,
  },
  progress: {
    flex: 1,
  },
  // Scrolled content slides under the header, never over it.
  clip: {
    overflow: 'hidden',
  },
  edgeFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EDGE_FADE,
  },
  content: {
    paddingTop: layout.contentOffset - 3 - 16,
    paddingHorizontal: spacing.gutter,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
});
