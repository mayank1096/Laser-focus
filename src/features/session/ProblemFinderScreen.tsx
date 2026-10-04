import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { PROBLEMS } from './fixes';
import { useSessions } from './store';

export function ProblemFinderScreen({
  navigation,
  route,
}: RootScreenProps<'ProblemFinder'>) {
  const { date, slotId } = route.params;
  const review = useSessions(s => s.review);
  const result = useSessions(s => s.results[date]?.[slotId]);
  const [picked, setPicked] = useState<string[]>([]);
  const h = Math.floor((result?.minutes ?? 0) / 60);
  const m = (result?.minutes ?? 0) % 60;

  return (
    <SimpleScreen
      testID="problem-finder"
      art={art.kneeling}
      progress={{ total: 2, filled: 1 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label="Show me the fix"
          disabled={picked.length === 0}
          onPress={() => {
            review(date, slotId, { brokeBecause: picked });
            navigation.replace('Fix', { date, slotId, reason: picked[0] });
          }}
        />
      }
    >
      <QuestionHeader
        eyebrow={`Where it broke · ${h}:${String(m).padStart(2, '0')}`}
        title="Even Arjuna’s arrow missed. What pulled you away?"
        subtitle="Pick every one that was true."
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          {PROBLEMS.map(p => {
            const on = picked.includes(p.id);
            return (
              <Pressable
                key={p.id}
                testID={`problem-${p.id}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  haptics.selection();
                  setPicked(x =>
                    on ? x.filter(i => i !== p.id) : [...x, p.id],
                  );
                }}
                style={[styles.row, on && styles.on]}
              >
                <AppText
                  variant="bodyMedium"
                  style={{ color: on ? colors.white : colors.ink }}
                >
                  {p.label}
                </AppText>
              </Pressable>
            );
          })}
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
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  on: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
});
