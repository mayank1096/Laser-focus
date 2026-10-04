import React from 'react';
import { StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { today as todayISO } from '../../utils/clock';
import { addDays, formatMinutes } from '../../utils/date';
import { planFor, usePlanning } from '../planning/store';
import { useSessions } from './store';

/** The course: Laser Focus → Achieve → Rest → Reassess → Repeat. */
export function RestScreen({ navigation }: RootScreenProps<'Rest'>) {
  const planning = usePlanning();
  const sessions = useSessions();
  const results = sessions.results[todayISO()] ?? {};
  const planned = planFor(planning, todayISO()).sessions.filter(s => s.task);
  const sat = Object.values(results).reduce((n, r) => n + r.minutes, 0);
  const tomorrow = planFor(planning, addDays(todayISO(), 1));

  return (
    <SimpleScreen
      testID="rest"
      tone="parchment"
      art={art.standing}
      hideBack
      onBack={() => {}}
      footer={
        tomorrow.sealedAt ? (
          <PrimaryButton
            testID="next-button"
            label="Done for today"
            onPress={() =>
              navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
            }
          />
        ) : (
          <PrimaryButton
            testID="next-button"
            label="Plan tomorrow"
            onPress={() =>
              navigation.reset({
                index: 1,
                routes: [
                  { name: 'Main' },
                  { name: 'PlanDay', params: { date: addDays(todayISO(), 1) } },
                ],
              })
            }
          />
        )
      }
    >
      <QuestionHeader
        eyebrow="Done for today"
        title="Rest."
        subtitle="Bhagavan ka naam lo, parivar ke saath samay bitao. Rest is part of the hunt."
      />
      <QuestionBody gap={26}>
        <View style={styles.card}>
          <View style={[styles.row, styles.divider]}>
            <AppText variant="bodyMedium">Today</AppText>
            <AppText variant="body" style={styles.muted}>
              {`${Object.keys(results).length} of ${
                planned.length
              } sessions · ${formatMinutes(sat)}`}
            </AppText>
          </View>
          <View style={styles.row}>
            <AppText variant="bodyMedium">Tomorrow</AppText>
            <AppText
              variant="body"
              style={tomorrow.sealedAt ? styles.saffron : styles.muted}
            >
              {tomorrow.sealedAt ? 'Sealed ✓' : 'Not sealed yet'}
            </AppText>
          </View>
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  muted: {
    color: colors.textMuted,
  },
  saffron: {
    color: colors.saffron,
  },
});
