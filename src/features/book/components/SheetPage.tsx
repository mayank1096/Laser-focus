import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChevronLeft from '../../../assets/icons/chevron-left.svg';
import { IconButton } from '../../../components/IconButton';
import { rise } from '../../../components/QuestionHeader';
import { SurfaceContext } from '../../../components/Surface';
import { colors, spacing, typography } from '../../../theme';
import { sansDigits } from '../../../components/Numerals';

export interface SheetPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Colour of the panel the sheet's content sits on. */
  panel?: string;
  /** Show a back arrow (stack screens); tabs leave it out. */
  onBack?: () => void;
  /** Extra space at the bottom, e.g. for the tab bar. */
  bottomInset?: number;
  children: React.ReactNode;
  testID?: string;
}

/**
 * The layout every Action Book sheet shares: a quiet header on white, then
 * the sheet itself on a softly tinted panel that rises from the bottom.
 */
export function SheetPage({
  eyebrow,
  title,
  subtitle,
  panel = colors.parchment,
  onBack,
  bottomInset = 0,
  children,
  testID,
}: SheetPageProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen} testID={testID}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        {onBack ? (
          <View style={styles.back}>
            <IconButton
              Icon={ChevronLeft}
              size={20}
              testID="back-button"
              accessibilityLabel="Back"
              onPress={onBack}
            />
          </View>
        ) : null}
        <Animated.Text entering={rise(0)} style={typography.eyebrow}>
          {eyebrow}
        </Animated.Text>
        <Animated.Text
          entering={rise(1)}
          style={[typography.display, styles.title]}
          accessibilityRole="header"
        >
          {sansDigits(title)}
        </Animated.Text>
        <Animated.Text entering={rise(2)} style={typography.body}>
          {subtitle}
        </Animated.Text>
      </View>
      <SurfaceContext.Provider value={colors.white}>
        <Animated.View
          entering={rise(3)}
          style={[styles.panel, { backgroundColor: panel }]}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + spacing.xxl + bottomInset },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </SurfaceContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: spacing.xxl,
    gap: spacing.xs,
  },
  back: {
    marginLeft: -10,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 32,
    lineHeight: 36,
    marginTop: spacing.xs,
  },
  panel: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.xl + 2,
    gap: spacing.md,
  },
});
