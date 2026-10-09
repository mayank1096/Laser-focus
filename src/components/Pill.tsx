import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import { colors, fonts, spacing } from '../theme';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';
import { TRACK } from './SegmentedControl';

/**
 * A larger choice, optionally with an icon: times, tasks, anything picked
 * from a short row. Chosen pills take a saffron tint and outline; only the
 * screen's main button is ever dark.
 */
export function Pill({
  label,
  Icon,
  selected,
  onPress,
  role = 'radio',
  testID,
}: {
  label: string;
  Icon?: React.FC<SvgProps>;
  selected: boolean;
  onPress: () => void;
  role?: 'radio' | 'button';
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole={role}
      accessibilityState={role === 'radio' ? { selected } : undefined}
      accessibilityLabel={label}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.picked,
        pressed && !selected && styles.pressed,
      ]}
    >
      {Icon ? (
        <Icon
          width={18}
          height={18}
          color={selected ? colors.saffron : colors.ink}
        />
      ) : null}
      <AppText style={styles.text} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** A row of pills that scrolls sideways and runs to the screen's edge. */
export function PillRow({
  children,
  bleed = true,
}: {
  children: React.ReactNode;
  /** Run past the right gutter to the screen's edge. */
  bleed?: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={bleed ? styles.bleed : undefined}
      contentContainerStyle={[styles.row, bleed && styles.rowBleed]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

/** An icon, a bold title, and an optional value on the right in saffron. */
export function SectionHeader({
  Icon,
  title,
  value,
  right,
}: {
  Icon?: React.FC<SvgProps>;
  title: string;
  value?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {Icon ? <Icon width={20} height={20} color={colors.ink} /> : null}
      <AppText variant="bodyBold" style={styles.headerTitle}>
        {title}
      </AppText>
      {value ? (
        <AppText variant="label" style={styles.headerValue}>
          {value}
        </AppText>
      ) : null}
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: TRACK,
  },
  picked: {
    backgroundColor: colors.saffronWash,
    borderColor: colors.saffron,
  },
  pressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  text: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.ink,
    maxWidth: 220,
  },
  bleed: {
    marginRight: -spacing.gutter,
  },
  row: {
    gap: 10,
  },
  rowBleed: {
    paddingRight: spacing.gutter,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
  },
  headerValue: {
    color: colors.saffron,
  },
});
