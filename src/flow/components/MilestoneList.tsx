import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import Check from '../../assets/icons/check.svg';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { AppText } from '../../components/AppText';
import { appDay, weekStart } from '../../core/days';
import type { Milestone } from '../../core/model';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import { monthLabel } from '../../i18n/format';
import { colors, fonts, motion, spacing, SMALL_TEXT } from '../../theme';
import { haptics } from '../../utils/haptics';

const INK_50 = 'rgba(0, 0, 0, 0.5)';
const INK_06 = 'rgba(0, 0, 0, 0.06)';

/**
 * The milestones as an accordion, as on the Home and Milestones designs:
 * the one being worked on opens by itself to this week's tasks; the rest
 * show done of all, with a thin track beneath each.
 */
export function MilestoneList({
  milestones,
  testIDPrefix,
  style,
}: {
  milestones: Milestone[];
  testIDPrefix: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const state = useBook();
  const current = milestones.findIndex(m => !m.done);
  const [open, setOpen] = useState(current === -1 ? 0 : current);
  // The milestone being worked on opens by itself, as in the design.
  useEffect(() => {
    setOpen(current === -1 ? 0 : current);
  }, [current]);
  const week = weekStart(appDay(), state.rhythm.reviewDay);
  const deep = state.tasks.filter(x => x.week === week && x.kind === 'deep');

  return (
    <View style={[styles.milestones, style]}>
      {milestones.map((m, i) => {
        const expanded = i === open;
        const isCurrent = i === current;
        const linked = deep.filter(x => x.milestoneId === m.id);
        // The count is every deep task this milestone has had, done of
        // all; the list below is this week's share of them.
        const all = state.tasks.filter(
          x => x.kind === 'deep' && x.milestoneId === m.id,
        );
        const done = all.filter(x => x.done).length;
        return (
          <Animated.View
            key={m.id}
            layout={LinearTransition.duration(motion.base)}
            style={styles.milestone}
          >
            <Pressable
              testID={`${testIDPrefix}-${m.id}`}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => {
                haptics.selection();
                setOpen(expanded ? -1 : i);
              }}
              style={styles.milestoneHead}
            >
              <ChevronDown
                width={18}
                height={18}
                strokeWidth={2}
                color={isCurrent ? colors.ink : INK_50}
                style={{
                  transform: [{ rotate: expanded ? '0deg' : '-90deg' }],
                }}
              />
              <AppText
                style={[
                  styles.milestoneName,
                  isCurrent ? styles.bold : styles.dim,
                ]}
                numberOfLines={1}
              >
                {m.text}
              </AppText>
              {m.done ? (
                <Check
                  width={16}
                  height={16}
                  color={colors.saffron}
                  strokeWidth={2.4}
                />
              ) : all.length || m.month ? (
                <AppText
                  style={[styles.count, isCurrent && styles.saffronText]}
                >
                  {all.length
                    ? `${done}/${all.length}`
                    : monthLabel(t, m.month!)}
                </AppText>
              ) : null}
            </Pressable>
            <View
              style={[
                styles.track,
                (isCurrent || m.done) && styles.trackCurrent,
              ]}
            >
              <View
                style={[
                  styles.trackFill,
                  {
                    width: m.done
                      ? '100%'
                      : isCurrent && all.length
                      ? `${(done / all.length) * 100}%`
                      : '0%',
                  },
                ]}
              />
            </View>
            {expanded ? (
              <Animated.View
                entering={FadeIn.duration(motion.base)}
                style={styles.week}
              >
                {/* The thread follows the list's height, never sets it. */}
                <View style={styles.weekThread}>
                  <Svg width={1} height="100%" style={StyleSheet.absoluteFill}>
                    <Line
                      x1={0.5}
                      x2={0.5}
                      y1={0}
                      y2="100%"
                      stroke="rgba(0, 0, 0, 0.1)"
                      strokeDasharray="4 4"
                    />
                  </Svg>
                </View>
                <View style={styles.weekList}>
                  <AppText style={styles.weekEyebrow}>
                    {t.today.thisWeek}
                  </AppText>
                  {linked.length ? (
                    linked.map((task, ti) => {
                      const active =
                        !task.done && ti === linked.findIndex(w => !w.done);
                      return (
                        <View key={task.id} style={styles.weekRow}>
                          <Svg width={14} height={14}>
                            <Circle
                              cx={7}
                              cy={7}
                              r={6.25}
                              stroke={
                                task.done || active
                                  ? colors.saffron
                                  : 'rgba(0, 0, 0, 0.2)'
                              }
                              strokeWidth={1.5}
                              fill={task.done ? colors.saffron : 'none'}
                            />
                          </Svg>
                          <AppText
                            style={[
                              styles.weekTask,
                              active ? styles.bold12 : styles.dim12,
                            ]}
                            numberOfLines={1}
                          >
                            {task.text}
                          </AppText>
                        </View>
                      );
                    })
                  ) : (
                    <AppText style={styles.dim12}>{t.today.noTasks}</AppText>
                  )}
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>
        );
      })}
    </View>
  );
}

const sans = (size: number, weight: 'regular' | 'medium' | 'bold') => ({
  // Small text is never heavier than regular.
  fontFamily:
    size <= SMALL_TEXT
      ? fonts.sans
      : weight === 'bold'
      ? fonts.sansBold
      : weight === 'medium'
      ? fonts.sansMedium
      : fonts.sans,
  fontSize: size,
  lineHeight: size * 1.3,
  // Small text gets a little air; larger text stays tight.
  letterSpacing: size <= 13 ? size * 0.02 : size * -0.02,
});

const styles = StyleSheet.create({
  milestones: {
    gap: 24,
  },
  milestone: {
    gap: 10,
  },
  milestoneHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  milestoneName: {
    flex: 1,
  },
  bold: {
    ...sans(14, 'bold'),
    color: colors.ink,
  },
  dim: {
    ...sans(14, 'medium'),
    color: INK_50,
  },
  count: {
    ...sans(14, 'bold'),
    color: colors.ink,
  },
  saffronText: {
    color: colors.saffron,
  },
  track: {
    height: 3,
    borderRadius: 999,
    backgroundColor: INK_06,
    overflow: 'hidden',
  },
  trackCurrent: {
    backgroundColor: 'rgba(250, 140, 34, 0.2)',
  },
  trackFill: {
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.saffron,
  },
  week: {
    flexDirection: 'row',
    gap: 12,
    // The 1pt thread hangs from the centre of the 18pt chevron above.
    marginLeft: 8.5,
    marginTop: 6,
  },
  weekThread: {
    width: 1,
    alignSelf: 'stretch',
  },
  weekList: {
    flex: 1,
    gap: 18,
    paddingBottom: spacing.xs,
  },
  weekEyebrow: {
    ...sans(10, 'medium'),
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    color: INK_50,
    marginBottom: -4,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekTask: {
    flex: 1,
  },
  bold12: {
    ...sans(12, 'bold'),
    color: colors.ink,
  },
  dim12: {
    ...sans(12, 'medium'),
    color: INK_50,
  },
});
