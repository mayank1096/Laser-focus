import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../components/AppText';
import { Chip, ChipRow } from '../../components/Chip';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { Stepper } from '../../components/Stepper';
import { appDay } from '../../core/days';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { dayDate } from '../../i18n/format';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing } from '../../theme';
import { addDays } from '../../utils/date';
import { haptics } from '../../utils/haptics';

const CHIPS = [3, 5, 7];

/** Every peak needs a valley. Pick how long, then put the app down. */
export function RestScreen({ navigation }: RootScreenProps<'Rest'>) {
  const t = useT();
  const [days, setDays] = useState(5);
  const [custom, setCustom] = useState(false);
  const until = addDays(appDay(), days);

  return (
    <SimpleScreen
      testID="rest"
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="rest-go"
          label={t.rest.go(dayDate(t, until))}
          onPress={() => {
            haptics.success();
            useBook.getState().rest(until);
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        />
      }
    >
      <QuestionHeader
        eyebrow={t.rest.title}
        title={t.rest.valley}
        subtitle={t.rest.why}
      />
      <QuestionBody gap={24}>
        <ChipRow wrap>
          {CHIPS.map(n => (
            <Chip
              key={n}
              testID={`rest-${n}`}
              role="radio"
              label={t.rest.days(n)}
              selected={!custom && days === n}
              onPress={() => {
                setCustom(false);
                setDays(n);
              }}
            />
          ))}
          <Chip
            testID="rest-pick"
            role="radio"
            label={t.rest.pickDate}
            selected={custom}
            onPress={() => setCustom(true)}
          />
        </ChipRow>
        {custom ? (
          <Animated.View
            entering={FadeIn.duration(motion.base)}
            style={styles.stepper}
          >
            <Stepper
              testID="rest-days"
              value={days}
              min={1}
              max={30}
              onChange={setDays}
              accessibilityLabel={t.rest.pickDate}
            />
            <AppText variant="bodyMedium">{dayDate(t, until)}</AppText>
          </Animated.View>
        ) : null}
        <View style={styles.list}>
          {t.rest.list.map(item => (
            <AppText key={item} variant="body" style={styles.item}>
              {`·  ${item}`}
            </AppText>
          ))}
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  list: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.parchment,
    gap: spacing.sm,
  },
  item: {
    color: colors.textMuted,
  },
});
