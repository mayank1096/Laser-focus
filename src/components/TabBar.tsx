import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import BookOpen from '../assets/icons/book-open.svg';
import ListChecks from '../assets/icons/list-checks.svg';
import Target from '../assets/icons/target.svg';
import User from '../assets/icons/user.svg';
import { colors, motion, spacing } from '../theme';
import { haptics } from '../utils/haptics';

export type TabId = 'today' | 'book' | 'tasks' | 'account';

export const TABS: { id: TabId; label: string; Icon: React.FC<SvgProps> }[] = [
  { id: 'today', label: 'Today', Icon: Target },
  { id: 'book', label: 'Action Book', Icon: BookOpen },
  { id: 'tasks', label: 'Tasks', Icon: ListChecks },
  { id: 'account', label: 'Account', Icon: User },
];

/** Height the bar takes from the bottom of the screen, above the inset. */
export const TAB_BAR_CLEARANCE = 92;

/**
 * Icons only. The active tab is marked by a single point of light beneath
 * it — the same saffron point every screen uses for "look here".
 */
export function TabBar({
  active,
  onChange,
  surface = colors.parchment,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  surface?: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: surface,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
      accessibilityRole="tablist"
    >
      {TABS.map(({ id, label, Icon }) => {
        const selected = id === active;
        return (
          <Pressable
            key={id}
            testID={`tab-${id}`}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            hitSlop={8}
            onPress={() => {
              if (!selected) {
                haptics.selection();
                onChange(id);
              }
            }}
            style={styles.tab}
          >
            <Icon
              width={22}
              height={22}
              color={selected ? colors.charcoal : 'rgba(0, 0, 0, 0.35)'}
              strokeWidth={1.6}
            />
            <View style={styles.dotSlot}>
              {selected ? (
                <Animated.View
                  key={id}
                  entering={ZoomIn.duration(motion.base)}
                  style={styles.dot}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingHorizontal: spacing.gutter + 22,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  tab: {
    alignItems: 'center',
    gap: 6,
    minWidth: 44,
  },
  dotSlot: {
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.saffron,
    boxShadow: '0px 0px 6px rgba(250, 140, 34, 0.9)',
  },
});
