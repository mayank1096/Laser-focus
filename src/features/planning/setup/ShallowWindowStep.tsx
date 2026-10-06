import Moon from '../../../assets/icons/moon.svg';
import Hourglass from '../../../assets/icons/hourglass.svg';
import Compass from '../../../assets/icons/compass.svg';
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../../components/AppText';
import { OptionCard, OptionList } from '../../../components/OptionCard';
import {
  QuestionBody,
  QuestionHeader,
} from '../../../components/QuestionHeader';
import { colors, motion, spacing } from '../../../theme';
import { formatWindow } from '../../../utils/date';
import { ClockSheet } from '../components/ClockSheet';
import { SHALLOW_PRESETS, shallowClashes, usePlanning } from '../store';

const HOUR = 60;

export function ShallowWindowStep() {
  const window = usePlanning(s => s.shallowWindow);
  const setWindow = usePlanning(s => s.setShallowWindow);
  const slots = usePlanning(s => s.slots);
  const [picking, setPicking] = useState(false);

  const is = (preset: keyof typeof SHALLOW_PRESETS) =>
    window.start === SHALLOW_PRESETS[preset].start &&
    window.end === SHALLOW_PRESETS[preset].end;
  const custom = !is('evening') && !is('lunch');

  return (
    <>
      <QuestionHeader
        eyebrow="Shallow work"
        title="When do the small things get done?"
        subtitle="Calls, payments, errands. One window, after deep work."
      />
      <QuestionBody>
        <OptionList>
          <OptionCard
            testID="shallow-evening"
            icon={Moon}
            title={`Evening · ${formatWindow(
              SHALLOW_PRESETS.evening.start,
              SHALLOW_PRESETS.evening.end,
            )}`}
            description="After your last session"
            selected={is('evening')}
            onPress={() => setWindow(SHALLOW_PRESETS.evening)}
          />
          <OptionCard
            testID="shallow-lunch"
            icon={Hourglass}
            title={`Lunch · ${formatWindow(
              SHALLOW_PRESETS.lunch.start,
              SHALLOW_PRESETS.lunch.end,
            )}`}
            description="Between sessions"
            selected={is('lunch')}
            onPress={() => setWindow(SHALLOW_PRESETS.lunch)}
          />
          <OptionCard
            testID="shallow-custom"
            icon={Compass}
            title={
              custom
                ? formatWindow(window.start, window.end)
                : 'Pick my own hour'
            }
            description={custom ? 'Tap to change' : 'Any one-hour window'}
            selected={custom}
            onPress={() => setPicking(true)}
          />
        </OptionList>
        {shallowClashes(window, slots) ? (
          <Animated.View entering={FadeIn.duration(motion.base)}>
            <AppText variant="caption" style={styles.warn}>
              This overlaps a deep session. Small things never take its place.
            </AppText>
          </Animated.View>
        ) : null}
      </QuestionBody>
      <ClockSheet
        testID="shallow-sheet"
        visible={picking}
        title="Shallow window starts"
        subtitle="It runs for one hour."
        value={window.start}
        max={22 * 60}
        onClose={() => setPicking(false)}
        onDone={start => {
          setWindow({ start, end: start + HOUR });
          setPicking(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  warn: {
    marginTop: spacing.lg,
    color: colors.ember,
  },
});
