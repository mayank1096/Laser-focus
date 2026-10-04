import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { art } from '../../../assets/art';
import { AppText } from '../../../components/AppText';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { SimpleScreen } from '../../../components/SimpleScreen';
import { TextField } from '../../../components/TextField';
import type { RootScreenProps } from '../../../navigation/types';
import { colors, motion, radii, spacing, typography } from '../../../theme';
import { now } from '../../../utils/clock';
import { useProfile } from '../store';

const DATE = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function NameScreen({ navigation }: RootScreenProps<'Name'>) {
  const name = useProfile(s => s.name);
  const setName = useProfile(s => s.setName);
  const ready = name.trim().length >= 2;

  return (
    <SimpleScreen
      testID="name"
      art={art.standing}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Continue"
          disabled={!ready}
          onPress={() => navigation.navigate('GoalSetup')}
        />
      }
    >
      <QuestionHeader
        eyebrow="Your name"
        title="What should we call you?"
        subtitle="Your first name. It goes on your vow."
      />
      <QuestionBody gap={28}>
        <TextField
          testID="name-input"
          accessibilityLabel="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Aarav"
          autoFocus
          maxLength={40}
        />
        {ready ? (
          <Animated.View
            entering={FadeIn.duration(motion.base)}
            style={styles.preview}
          >
            <AppText variant="eyebrow">How it will look on your vow</AppText>
            <AppText variant="heading">मैं प्रतिज्ञा लेता हूँ।</AppText>
            <View style={styles.signature}>
              <AppText variant="title" style={styles.name} numberOfLines={1}>
                {name.trim()}
              </AppText>
              <AppText variant="micro" style={styles.date}>
                {DATE.format(now())}
              </AppText>
            </View>
          </Animated.View>
        ) : null}
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  preview: {
    marginTop: spacing.xl,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radii.field,
    backgroundColor: colors.parchment,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  signature: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.border,
  },
  name: {
    ...typography.title,
    fontSize: 22,
    color: colors.textFaint,
    flex: 1,
  },
  date: {
    color: colors.textMuted,
  },
});
