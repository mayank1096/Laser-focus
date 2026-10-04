import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
  rise,
} from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { PRATIGYAS, useProfile } from '../account/store';
import { VOW_STEPS } from './PathScreen';

export function VowAsksScreen({ navigation }: RootScreenProps<'VowAsks'>) {
  const pratigya = useProfile(s => s.pratigya) ?? 'arjun';
  const vow = PRATIGYAS[pratigya];
  return (
    <SimpleScreen
      testID="vow-asks"
      art={art.drawingBow}
      progress={{ total: VOW_STEPS, filled: 3 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="I understand"
          onPress={() => navigation.navigate('Permissions')}
        />
      }
    >
      <QuestionHeader
        eyebrow={`${vow.name} प्रतिज्ञा`}
        title="Before you take it, know what it asks of you."
        subtitle="Break it, and Laser Focus closes until you keep it again."
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          {vow.asks.map((ask, i) => (
            <Animated.View key={ask} entering={rise(4 + i)} style={styles.row}>
              <AppText style={styles.n}>{i + 1}</AppText>
              <AppText variant="body" style={styles.flex}>
                {ask}
              </AppText>
            </Animated.View>
          ))}
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  n: {
    ...typography.button,
    color: colors.saffron,
  },
  flex: {
    flex: 1,
  },
});
