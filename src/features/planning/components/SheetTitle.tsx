import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { spacing } from '../../../theme';

/** Heading and optional line at the top of a bottom sheet. */
export function SheetTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.title}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
});
