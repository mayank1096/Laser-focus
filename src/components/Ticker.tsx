import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Points per second: slow enough to read. */
const SPEED = 32;
/** Space between the end of the text and its next pass. */
const GAP = 48;
/** A beat before it starts moving, so the start can be read. */
const PAUSE = 1200;

/**
 * Always one line. Text that fits sits still and centred; text that
 * doesn't scrolls slowly to the left in a seamless loop.
 */
export function Ticker({
  text,
  style,
  testID,
}: {
  text: string;
  style?: TextStyle;
  testID?: string;
}) {
  const [box, setBox] = useState(0);
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const moving = box > 0 && width > box;

  useEffect(() => {
    cancelAnimation(x);
    x.value = 0;
    if (moving) {
      const distance = width + GAP;
      x.value = withDelay(
        PAUSE,
        withRepeat(
          withTiming(-distance, {
            duration: (distance / SPEED) * 1000,
            easing: Easing.linear,
          }),
          -1,
        ),
      );
    }
    return () => cancelAnimation(x);
  }, [moving, width, x]);

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  return (
    <View
      style={styles.box}
      onLayout={e => setBox(e.nativeEvent.layout.width)}
      accessibilityLabel={text}
      testID={testID}
    >
      {/* Measured off-screen at its natural one-line width. */}
      <View style={styles.measure} pointerEvents="none">
        <Text
          style={[style, styles.noWrap]}
          onLayout={e => setWidth(e.nativeEvent.layout.width)}
        >
          {text}
        </Text>
      </View>
      {moving ? (
        <Animated.View style={[styles.row, slide]}>
          <Text style={[style, styles.noWrap]} numberOfLines={1}>
            {text}
          </Text>
          <View style={{ width: GAP }} />
          <Text style={[style, styles.noWrap]} numberOfLines={1}>
            {text}
          </Text>
        </Animated.View>
      ) : (
        <Text style={[style, styles.center]} numberOfLines={1}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  measure: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4000,
    flexDirection: 'row',
    opacity: 0,
  },
  noWrap: {
    flexShrink: 0,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    width: 4000,
  },
  center: {
    textAlign: 'center',
  },
});
