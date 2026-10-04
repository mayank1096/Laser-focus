import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { FlowFrame } from '../../../components/FlowFrame';
import { HoldButton } from '../../../components/HoldButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import type { RootScreenProps } from '../../../navigation/types';
import { reminders } from '../../../services/reminders';
import { colors, motion, spacing } from '../../../theme';
import { now, today } from '../../../utils/clock';
import { addDays, formatClock, formatDay } from '../../../utils/date';
import { planFor, usePlanning } from '../store';

const COUNT = ['No', 'One', 'Two', 'Three'];

/** The last step of the night: hold to seal tomorrow, then rest. */
export function SealDayScreen({
  navigation,
  route,
}: RootScreenProps<'SealDay'>) {
  const { date } = route.params;
  const state = usePlanning();
  const sealDay = usePlanning(s => s.sealDay);
  const day = planFor(state, date);
  const planned = day.sessions.filter(s => s.task && s.sheet);
  const [sealed, setSealed] = useState(day.sealedAt !== null);
  const isTomorrow = date === addDays(today(), 1);

  const seal = () => {
    if (sealDay(date, now().toISOString())) {
      reminders.cancelNightly();
      setSealed(true);
    }
  };

  const n = COUNT[planned.length] ?? String(planned.length);
  const sessions =
    planned.length === 1
      ? 'session has its sheet'
      : 'sessions have their sheets';

  return (
    <FlowFrame
      testID="seal-day"
      stepKey={sealed ? 'sealed' : 'seal'}
      direction="forward"
      art={require('../../../assets/images/warrior-standing.jpg')}
      onBack={() => navigation.goBack()}
      footer={
        sealed ? (
          <Animated.View entering={FadeIn.duration(motion.base)}>
            <PrimaryButton
              testID="seal-rest"
              label="Rest"
              onPress={() =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main', params: { tab: 'tasks' } }],
                })
              }
            />
          </Animated.View>
        ) : (
          <>
            <HoldButton
              testID="seal-hold"
              label="Hold to seal"
              onComplete={seal}
            />
            <AppText variant="micro" style={styles.hint}>
              {planned[0]
                ? `Nothing to decide before ${formatClock(
                    planned[0].slot.start,
                  )}`
                : ' '}
            </AppText>
          </>
        )
      }
    >
      <QuestionHeader
        eyebrow={`${isTomorrow ? 'Tomorrow · ' : ''}${formatDay(date)}`}
        title={
          sealed
            ? `${isTomorrow ? 'Tomorrow' : 'The day'} is sealed.`
            : 'Nothing left to decide.'
        }
        subtitle={
          sealed
            ? 'Rest now. The plan does the remembering.'
            : `${n} ${sessions}. Seal it and sleep.`
        }
      />
      <QuestionBody gap={26}>
        <View style={styles.card}>
          {planned.map((s, i) => (
            <View
              key={s.slot.id}
              style={[styles.row, i < planned.length - 1 && styles.divider]}
            >
              <AppText variant="bodyBold">{formatClock(s.slot.start)}</AppText>
              <AppText variant="body" style={styles.flex} numberOfLines={1}>
                {s.task?.text}
              </AppText>
              {sealed ? (
                <Animated.View
                  entering={ZoomIn.delay(i * motion.stagger).springify()}
                >
                  <AppText variant="bodyBold" style={styles.tick}>
                    ✓
                  </AppText>
                </Animated.View>
              ) : (
                <AppText variant="bodyBold" style={styles.tickQuiet}>
                  ✓
                </AppText>
              )}
            </View>
          ))}
        </View>
      </QuestionBody>
    </FlowFrame>
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
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  flex: {
    flex: 1,
  },
  tick: {
    color: colors.saffron,
  },
  tickQuiet: {
    color: colors.textGhost,
  },
  hint: {
    textAlign: 'center',
    color: colors.white,
    opacity: 0.85,
  },
});
