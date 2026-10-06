import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  type SvgProps,
} from 'react-native-svg';
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
  /** Kept for callers; the floating pill is the same on every tab. */
  surface?: string;
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
      {/* Content fades to white behind the floating bar. */}
      <Svg style={styles.fade} width="100%" height={177} pointerEvents="none">
        <Defs>
          <LinearGradient id="tab-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.14" stopColor="#F7F4F2" stopOpacity="0" />
            <Stop offset="0.42" stopColor={colors.white} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={177} fill="url(#tab-fade)" />
      </Svg>
      <View style={styles.bar} accessibilityRole="tablist">
        <Animated.View style={[styles.marker, markerStyle]} />
        {TABS.map(({ id, label, Icon }) => {
          const selected = id === active;
          const tint = selected ? colors.ink : colors.textFaint;
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
              <Icon width={18} height={18} color={tint} strokeWidth={1.8} />
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
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.white,
    boxShadow: '0px 14px 27px rgba(0, 0, 0, 0.06)',
  },
  marker: {
    position: 'absolute',
    top: spacing.sm,
    bottom: spacing.sm,
    left: 0,
    borderRadius: radii.pill,
    backgroundColor: colors.saffron,
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 12,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 177,
  },
});
