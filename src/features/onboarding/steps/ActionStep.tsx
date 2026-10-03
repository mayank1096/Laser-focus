import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import CheckIcon from '../../../assets/icons/check.svg';
import CrossIcon from '../../../assets/icons/cross.svg';
import { AppText } from '../../../components/AppText';
import { colors, layout, motion, spacing, typography } from '../../../theme';
import {
  QuestionBody,
  QuestionHeader,
  rise,
} from '../components/QuestionHeader';
import { useGoalSetup } from '../store';

const EXAMPLES: { text: string; good: boolean }[] = [
  { text: 'Attempt a full-length mock test', good: true },
  { text: 'Study properly', good: false },
  { text: 'Be more disciplined', good: false },
];

export function ActionStep() {
  const action = useGoalSetup(s => s.action);
  const setAction = useGoalSetup(s => s.setAction);
  const [focused, setFocused] = useState(false);
  const glow = useSharedValue(0);

  const glowStyle = useAnimatedStyle(() => ({
    boxShadow: `0px 0px ${4 + glow.value * 8}px ${colors.saffronGlow}`,
  }));

  const setFocus = (next: boolean) => {
    setFocused(next);
    glow.value = withTiming(next ? 1 : 0, { duration: motion.base });
  };

  return (
    <>
      <QuestionHeader
        eyebrow="The action"
        title="You cannot control the result. What is the action that produces it?"
        subtitle="Start with a verb. Something you could do tomorrow morning."
      />
      <QuestionBody>
        <Animated.View style={[styles.pill, glowStyle]}>
          <TextInput
            testID="action-input"
            value={action}
            onChangeText={setAction}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder={focused ? '' : 'Attempt a full-length mock test'}
            placeholderTextColor={colors.textGhost}
            selectionColor={colors.saffron}
            cursorColor={colors.saffron}
            returnKeyType="done"
            maxLength={80}
            style={[typography.bodyMedium, styles.input]}
          />
        </Animated.View>
      </QuestionBody>

      <Animated.View entering={rise(4)} style={styles.examples}>
        <View style={styles.exampleCopy}>
          <AppText variant="caption">Example:</AppText>
          <AppText variant="caption">
            Could a stranger watch you do it and tell exactly when you stopped?
          </AppText>
        </View>
        <View style={styles.exampleList}>
          {EXAMPLES.map(example => (
            <View key={example.text} style={styles.exampleRow}>
              {example.good ? (
                <CheckIcon width={16} height={16} />
              ) : (
                <CrossIcon width={16} height={16} />
              )}
              <AppText variant="caption">{example.text}</AppText>
            </View>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: layout.fieldHeight,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.saffron,
  },
  input: {
    padding: 0,
  },
  examples: {
    marginTop: 40,
    gap: 19,
  },
  exampleCopy: {
    gap: spacing.xs,
  },
  exampleList: {
    gap: 10,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
