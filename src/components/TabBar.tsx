import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import BookOpen from '../assets/icons/book-open.svg';
import ListChecks from '../assets/icons/list-checks.svg';
import Target from '../assets/icons/target.svg';
import User from '../assets/icons/user.svg';
import { colors, motion, radii, spacing, typography } from '../theme';
import { haptics } from '../utils/haptics';

export type TabId = 'today' | 'book' | 'tasks' | 'account';

export const TABS: { id: TabId; label: string; Icon: React.FC<SvgProps> }[] = [
  { id: 'today', label: 'Today', Icon: Target },
  { id: 'book', label: 'Action Book', Icon: BookOpen },
  { id: 'tasks', label: 'Tasks', Icon: ListChecks },
  { id: 'account', label: 'Account', Icon: User },
];

/** Height the floating bar takes from the bottom of the screen. */
export const TAB_BAR_CLEARANCE = 110;

interface Box {
  x: number;
  width: number;
}

/**
 * The floating navigation pill. The saffron marker slides to the chosen
 * tab rather than jumping.
 */
export function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  const insets = useSafeAreaInsets();
  const [boxes, setBoxes] = useState<Partial<Record<TabId, Box>>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const target = boxes[active];

  useEffect(() => {
    if (!target) {
      return;
    }
    // First placement is instant; later moves glide.
    if (width.value === 0) {
      x.value = target.x;
      width.value = target.width;
    } else {
      x.value = withSpring(target.x, motion.spring);
      width.value = withSpring(target.width, motion.spring);
    }
  }, [target, x, width]);

  const markerStyle = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ translateX: x.value }],
    opacity: width.value > 0 ? 1 : 0,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}
    >
      <View style={styles.bar} accessibilityRole="tablist">
        <Animated.View style={[styles.marker, markerStyle]} />
        {TABS.map(({ id, label, Icon }) => {
          const selected = id === active;
          const tint = selected ? colors.white : colors.textFaint;
          return (
            <Pressable
              key={id}
              testID={`tab-${id}`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              onLayout={e => {
                const { x: bx, width: bw } = e.nativeEvent.layout;
                setBoxes(prev =>
                  prev[id]?.x === bx && prev[id]?.width === bw
                    ? prev
                    : { ...prev, [id]: { x: bx, width: bw } },
                );
              }}
              onPress={() => {
                if (!selected) {
                  haptics.selection();
                  onChange(id);
                }
              }}
              style={styles.tab}
            >
              <Icon width={20} height={20} color={tint} strokeWidth={1.6} />
              <Animated.Text
                style={[typography.label, styles.label, { color: tint }]}
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 325,
    padding: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    boxShadow: '0px 12px 30px rgba(226, 94, 0, 0.12)',
  },
  marker: {
    position: 'absolute',
    top: spacing.md,
    bottom: spacing.md,
    left: 0,
    borderRadius: radii.pill,
    backgroundColor: colors.saffron,
  },
  tab: {
    minWidth: 62,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 11,
  },
});
