import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { colors, spacing } from '../../theme';

/** A white card with a small header row, holding a list of rows. */
export function SectionCard({
  title,
  meta,
  children,
  testID,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.head}>
        <AppText variant="eyebrow">{title}</AppText>
        {meta ? (
          <AppText variant="micro" style={styles.meta}>
            {meta}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** A row inside a card, with a hairline under all but the last. */
export function CardRow({
  last,
  children,
}: {
  last?: boolean;
  children: React.ReactNode;
}) {
  return <View style={[styles.row, !last && styles.divider]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: spacing.sm,
    paddingHorizontal: 14,
  },
  meta: {
    color: colors.textMuted,
  },
  row: {
    paddingHorizontal: 14,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: colors.divider,
  },
});
