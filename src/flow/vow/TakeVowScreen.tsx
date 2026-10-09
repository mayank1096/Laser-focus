import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { HoldButton } from '../../components/HoldButton';
import { sansDigits } from '../../components/Numerals';
import { rise } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { appDay } from '../../core/days';
import { circledGoal, useBook } from '../../core/store';
import { useProfile, type Pratigya } from '../../features/account/store';
import { useT, type Strings } from '../../i18n';
import { shortDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { now } from '../../utils/clock';
import { VOW_STEPS } from './PratigyaScreen';

/** "Clear CA Foundation" → "clear CA Foundation", to sit inside a sentence. */

export function vowText(t: Strings, pratigya: Pratigya, goal: string): string {
  const v = t.vow.names[pratigya];
  return typeof v.text === 'function' ? v.text(goal) : v.text;
}

export function TakeVowScreen({ navigation }: RootScreenProps<'TakeVow'>) {
  const t = useT();
  const pratigya = useProfile(s => s.pratigya) ?? 'arjun';
  const takeVow = useProfile(s => s.takeVow);
  const goal = useBook(s => circledGoal(s)?.text ?? '');

  return (
    <SimpleScreen
      testID="take-vow"
      art={art.kneeling}
      progress={{ total: VOW_STEPS, filled: 5 }}
      onBack={() => navigation.goBack()}
      footer={
        <HoldButton
          testID="vow-hold"
          label={t.vow.takeHold}
          duration={2400}
          onComplete={() => {
            takeVow(now().toISOString());
            useBook.getState().setSetup('plan');
            navigation.reset({ index: 0, routes: [{ name: 'DayOne' }] });
          }}
        />
      }
    >
      <Animated.Text entering={rise(0)} style={typography.eyebrow}>
        {t.vow.takeEyebrow}
      </Animated.Text>
      <Animated.Text entering={rise(1)} style={styles.devanagari}>
        मैं प्रतिज्ञा लेता हूँ।
      </Animated.Text>
      <Animated.Text entering={rise(2)} style={styles.vow}>
        {sansDigits(vowText(t, pratigya, goal))}
      </Animated.Text>
      <Animated.View entering={rise(3)} style={styles.signature}>
        <AppText variant="label" style={styles.muted}>
          {t.vow.signature}
        </AppText>
        <AppText variant="label" style={styles.muted}>
          {shortDate(t, appDay())}
        </AppText>
      </Animated.View>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  devanagari: {
    ...typography.title,
    marginTop: spacing.xl,
  },
  vow: {
    ...typography.heading,
    fontSize: 18,
    lineHeight: 26,
    marginTop: spacing.xxl,
  },
  signature: {
    marginTop: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.border,
  },
  muted: {
    color: colors.textMuted,
  },
});
