import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RulerPicker } from '../../components/RulerPicker';
import type { ClockTime } from '../../types/models';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import { spacing } from '../../theme';
import { SheetTitle } from './SheetTitle';

/** Times move in quarter hours. */
const STEP = 15;

export interface ClockSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  value: ClockTime;
  /** Earliest and latest choice. */
  min?: ClockTime;
  max?: ClockTime;
  onDone: (value: ClockTime) => void;
  onClose: () => void;
  /** Extra controls under the ruler, e.g. session length. */
  children?: React.ReactNode;
  /** Shown beside Done, e.g. a remove link. */
  footer?: React.ReactNode;
  testID?: string;
}

/** A bottom sheet with a time ruler. Nothing changes until Done. */
export function ClockSheet({
  visible,
  title,
  subtitle,
  value,
  min = 4 * 60,
  max = 23 * 60 + 45,
  onDone,
  onClose,
  children,
  footer,
  testID,
}: ClockSheetProps) {
  const t = useT();
  const [draft, setDraft] = useState(value);
  // Start from the current value every time the sheet opens.
  useEffect(() => {
    if (visible) {
      setDraft(value);
    }
  }, [visible, value]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={title}
      testID={testID}
    >
      <SheetTitle title={title} subtitle={subtitle} />
      <View style={styles.ruler}>
        <RulerPicker
          testID={testID ? `${testID}-ruler` : undefined}
          accessibilityLabel={title}
          value={Math.round(draft / STEP)}
          min={Math.round(min / STEP)}
          max={Math.round(max / STEP)}
          onChange={v => setDraft(v * STEP)}
          formatLabel={v => clock(t, v * STEP)}
        />
      </View>
      {children ? <View style={styles.extra}>{children}</View> : null}
      <View style={styles.actions}>
        <PrimaryButton
          testID={testID ? `${testID}-done` : undefined}
          label="Done"
          shadow="none"
          onPress={() => onDone(draft)}
        />
        {footer}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  ruler: {
    paddingHorizontal: 13,
  },
  extra: {
    marginTop: spacing.xxl,
  },
  actions: {
    marginTop: spacing.xxl + spacing.md,
    gap: spacing.lg,
  },
});
