import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
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
import { useT } from '../i18n';
import { colors, radii, springs, typography } from '../theme';
import { haptics } from '../utils/haptics';

export type TabId = 'today' | 'book' | 'tasks' | 'account';

export const TABS: { id: TabId; Icon: React.FC<SvgProps> }[] = [
  { id: 'today', Icon: Target },
  { id: 'book', Icon: BookOpen },
  { id: 'tasks', Icon: ListChecks },
  { id: 'account', Icon: User },
];

/** Height the floating bar takes from the bottom of the screen. */
export const TAB_BAR_CLEARANCE = 104;

const CAPSULE = '#16110E';
const ICON_IDLE = 'rgba(244, 238, 230, 0.55)';

/**
 * The menu: a small dark capsule floating above the content. Only the tab
 * you're on says its name — it opens into a saffron pill on a morph spring
 * while the others stay quiet icons — so the bar reads "you are here"
 * instead of a row of four labels competing for attention.
 */
export function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  /** Kept for callers; the capsule is the same on every tab. */
  surface?: string;
}) {
  const insets = useSafeAreaInsets();
  const t = useT();
  return (
    <View
      pointerEvents="box-none"
      style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 14) + 4 }]}
    >
      {/* Content fades out behind the capsule. */}
      <Svg style={styles.fade} width="100%" height={150} pointerEvents="none">
        <Defs>
          <LinearGradient id="tab-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F7F4F2" stopOpacity="0" />
            <Stop offset="0.55" stopColor="#F7F4F2" stopOpacity="0.92" />
            <Stop offset="1" stopColor="#F7F4F2" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height={150} fill="url(#tab-fade)" />
      </Svg>
      <View style={styles.capsule} accessibilityRole="tablist">
        {TABS.map(tab => (
          <Tab
            key={tab.id}
            {...tab}
            label={t.tabs[tab.id]}
            selected={tab.id === active}
            onPress={() => {
              if (tab.id !== active) {
                haptics.selection();
                onChange(tab.id);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

function Tab({
  id,
  label,
  Icon,
  selected,
  onPress,
}: {
  id: TabId;
  label: string;
  Icon: React.FC<SvgProps>;
  selected: boolean;
  onPress: () => void;
}) {
  const [labelWidth, setLabelWidth] = useState(0);
  const on = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(1);

  useEffect(() => {
    on.value = withSpring(selected ? 1 : 0, springs.morph);
  }, [selected, on]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      on.value,
      [0, 1],
      ['rgba(250, 140, 34, 0)', colors.saffron],
    ),
    transform: [{ scale: press.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    width: Math.max(0, on.value) * (labelWidth + 8),
    opacity: on.value,
  }));

  return (
    <Pressable
      testID={`tab-${id}`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(0.92, springs.snappy);
      }}
      onPressOut={() => {
        press.value = withSpring(1, springs.snappy);
      }}
    >
      <Animated.View style={[styles.tab, pillStyle]}>
        <Icon
          width={20}
          height={20}
          color={selected ? CAPSULE : ICON_IDLE}
          strokeWidth={1.8}
        />
        <Animated.View style={[styles.labelSlot, labelStyle]}>
          <Text numberOfLines={1} style={[typography.label, styles.label]}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
      {/* Measures the label once, so the pill knows how far to open. */}
      <Text
        style={[typography.label, styles.measure]}
        onLayout={e => setLabelWidth(e.nativeEvent.layout.width)}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {label}
      </Text>
    </Pressable>
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
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: radii.pill,
    backgroundColor: CAPSULE,
    boxShadow: '0px 16px 32px rgba(40, 20, 8, 0.28)',
  },
  tab: {
    height: 46,
    minWidth: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: radii.pill,
  },
  labelSlot: {
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  label: {
    paddingLeft: 8,
    color: CAPSULE,
    fontFamily: typography.bodyBold.fontFamily,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    fontFamily: typography.bodyBold.fontFamily,
  },
});
