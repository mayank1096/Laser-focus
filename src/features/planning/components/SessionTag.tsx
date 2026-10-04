import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { useSurface } from '../../../components/Surface';
import { colors, radii, spacing } from '../../../theme';

/** Small pill naming the session a sheet belongs to. */
export function SessionTag({ text }: { text: string }) {
  const surface = useSurface();
  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor:
            surface === colors.blush ? colors.blushDeep : colors.stone,
        },
      ]}
    >
      <AppText variant="micro" style={styles.text} numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    marginBottom: spacing.xl,
  },
  text: {
    color: colors.textMuted,
  },
});
