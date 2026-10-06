import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, motion, spacing, springs } from '../theme';
import { SurfaceContext } from './Surface';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  accessibilityLabel: string;
  testID?: string;
}

/** Drag down this far (or flick) to dismiss. */
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const OFFSCREEN = 900;

/**
 * A sheet that rises from the bottom over a dimmed screen. Tap the scrim,
 * drag the sheet down or use the system back to close it.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  accessibilityLabel,
  testID,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  // Stay mounted while the closing animation plays.
  const [mounted, setMounted] = useState(visible);
  const offset = useSharedValue(OFFSCREEN);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.value = 0;
      offset.value = withSpring(0, springs.smooth);
    } else if (mounted) {
      offset.value = withTiming(
        OFFSCREEN,
        { duration: motion.base, easing: Easing.in(Easing.quad) },
        finished => {
          if (finished) {
            scheduleOnRN(setMounted, false);
          }
        },
      );
    }
  }, [visible, mounted, offset, drag]);

  const pan = usePanGesture({
    activeOffsetY: 6,
    onUpdate: e => {
      'worklet';
      // Resist dragging up; follow dragging down.
      drag.value = e.translationY > 0 ? e.translationY : e.translationY * 0.15;
    },
    onDeactivate: e => {
      'worklet';
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        drag.value = withSpring(0, motion.spring);
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value + drag.value }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.value + drag.value, [0, 400], [1, 0], 'clamp'),
  }));

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable
            style={styles.fill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>
        <KeyboardAvoidingView
          style={styles.anchor}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          <Animated.View
            testID={testID}
            accessibilityViewIsModal
            accessibilityLabel={accessibilityLabel}
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom + spacing.xxl },
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={pan}>
              <View style={styles.handleArea}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>
            <SurfaceContext.Provider value={colors.white}>
              {children}
            </SurfaceContext.Provider>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.scrim,
  },
  anchor: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.gutter,
  },
  // A generous grab area above the content, so dragging is easy to find.
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 18,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
  },
});
