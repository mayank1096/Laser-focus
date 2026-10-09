import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import ChevronRight from '../assets/icons/chevron-right.svg';
import { colors, spacing } from '../theme';
import { haptics } from '../utils/haptics';
import { AppText } from './AppText';

/** A titled group of rows on one white card, as on Account and Settings. */
export function SettingsSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <AppText variant="eyebrow">{title}</AppText> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/**
 * One row: an icon, a title with an optional line under it, and a chevron
 * when it goes somewhere (or any trailing control). `children` open below
 * the row, inside the same divider.
 */
export function SettingsRow({
  Icon,
  title,
  detail,
  onPress,
  trailing,
  last,
  danger,
  testID,
  children,
}: {
  Icon: React.FC<SvgProps>;
  title: string;
  detail?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  last?: boolean;
  danger?: boolean;
  testID?: string;
  children?: React.ReactNode;
}) {
  const tint = danger ? colors.danger : colors.ink;
  return (
    <View style={!last && styles.divider}>
      <Pressable
        testID={testID}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        onPress={() => {
          haptics.tap();
          onPress?.();
        }}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <Icon width={20} height={20} color={tint} strokeWidth={1.6} />
        <View style={styles.text}>
          <AppText variant="heading" style={[styles.title, { color: tint }]}>
            {title}
          </AppText>
          {detail ? (
            <AppText variant="micro" style={styles.detail}>
              {detail}
            </AppText>
          ) : null}
        </View>
        {trailing ??
          (onPress ? (
            <ChevronRight
              width={16}
              height={16}
              color={colors.textMuted}
              strokeWidth={1.75}
            />
          ) : null)}
      </Pressable>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pressed: {
    backgroundColor: colors.stone,
  },
  text: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontSize: 15,
  },
  detail: {
    color: colors.textMuted,
  },
});
