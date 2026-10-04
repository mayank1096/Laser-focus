import React, { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, layout, motion, radii, typography } from '../theme';
import { useSurface } from './Surface';

export interface TextFieldProps
  extends Pick<
    TextInputProps,
    | 'value'
    | 'onChangeText'
    | 'placeholder'
    | 'onSubmitEditing'
    | 'returnKeyType'
    | 'autoFocus'
    | 'maxLength'
    | 'accessibilityLabel'
    | 'testID'
  > {
  /** Grows to several lines; return still submits. */
  multiline?: boolean;
}

/**
 * The one-line answer field used on sheets. Hairline at rest; a saffron
 * outline and soft glow while typing, matching the list fields.
 */
export const TextField = forwardRef<
  React.ComponentRef<typeof TextInput>,
  TextFieldProps
>(function TextFieldInput(
  { multiline = false, maxLength = 90, returnKeyType = 'done', ...rest },
  ref,
) {
  const surface = useSurface();
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);

  const frameStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [colors.hairline, colors.saffron],
    ),
    boxShadow: `0px 0px ${4 + focus.value * 4}px rgba(250, 140, 34, ${
      focus.value * 0.6
    })`,
  }));

  const setFocus = (next: boolean) => {
    setFocused(next);
    focus.value = withTiming(next ? 1 : 0, { duration: motion.fast });
  };

  return (
    <Animated.View
      style={[styles.frame, { backgroundColor: surface }, frameStyle]}
    >
      <TextInput
        ref={ref}
        {...rest}
        placeholder={focused ? '' : rest.placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        multiline={multiline}
        submitBehavior="blurAndSubmit"
        returnKeyType={returnKeyType}
        maxLength={maxLength}
        placeholderTextColor={colors.textGhost}
        selectionColor={colors.saffron}
        cursorColor={colors.saffron}
        style={[typography.body, styles.input]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  frame: {
    minHeight: layout.fieldHeight + 4,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.field,
    borderWidth: 1,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
});
