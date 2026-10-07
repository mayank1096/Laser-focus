import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, type SvgProps } from 'react-native-svg';
import { art } from '../../../assets/art';
import Ban from '../../../assets/icons/ban.svg';
import Bell from '../../../assets/icons/bell.svg';
import ChevronRight from '../../../assets/icons/chevron-right.svg';
import Crown from '../../../assets/icons/crown.svg';
import Flag from '../../../assets/icons/flag.svg';
import Languages from '../../../assets/icons/languages.svg';
import LogOut from '../../../assets/icons/log-out.svg';
import Mail from '../../../assets/icons/mail.svg';
import Scroll from '../../../assets/icons/scroll-text.svg';
import Shield from '../../../assets/icons/shield-check.svg';
import { AppText } from '../../../components/AppText';
import { rise } from '../../../components/QuestionHeader';
import { TAB_BAR_CLEARANCE } from '../../../components/TabBar';
import { colors, fonts, spacing } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { useGoalProgress, useRecentMarks, useStreak } from '../../progress';
import type { DayMark } from '../../session/store';
import { PRATIGYAS, useProfile } from '../store';

export type AccountDestination =
  | 'values'
  | 'antiGoals'
  | 'pratigya'
  | 'signOut';

export function AccountScreen({
  onOpen,
}: {
  onOpen: (to: AccountDestination) => void;
}) {
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const progress = useGoalProgress();
  const marks = useRecentMarks(35).map(m => m.mark);
  const streak = useStreak();
  const [confirmOut, setConfirmOut] = useState(false);
  const deleted = profile.apps.filter(a => a.deleted).length;
  const contact = profile.account?.phone
    ? `+${profile.account.phone.slice(0, 2)} ${profile.account.phone.slice(
        2,
        7,
      )} ${profile.account.phone.slice(7)}`
    : profile.account?.email ?? 'Not signed in';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingBottom: insets.bottom + TAB_BAR_CLEARANCE,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={rise(0)}
        style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}
      >
        <DayRing progress={Math.min(1, progress.day / progress.days)}>
          <Image source={art.kneeling} style={styles.avatarImage} />
        </DayRing>
        <AppText variant="title" style={styles.name}>
          {profile.name || 'You'}
        </AppText>
        <AppText variant="label" style={styles.muted}>
          {[
            `Day ${progress.day} of ${progress.days}`,
            profile.pratigya ? PRATIGYAS[profile.pratigya].latin : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </AppText>

        <View style={styles.statsCard}>
          <View style={styles.stats}>
            <Stat value={streak} label="Day streak" />
            <View style={styles.statRule} />
            <Stat
              value={marks.filter(m => m === 'full').length}
              label="Full marks"
            />
            <View style={styles.statRule} />
            <Stat value={progress.days - progress.day} label="Days left" />
          </View>
          <View style={styles.calendarHead}>
            <AppText variant="eyebrow">Last 5 weeks</AppText>
            <AppText variant="micro" style={styles.muted}>
              {`${marks.filter(m => m === 'full' || m === 'half').length}/${
                marks.length
              } marked`}
            </AppText>
          </View>
          <View style={styles.calendar}>
            {marks.map((m, i) => (
              <MarkDot key={i} mark={m} today={i === marks.length - 1} />
            ))}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={rise(1)} style={styles.body}>
        <Section title="Once in a lifetime">
          <Row
            Icon={Scroll}
            title="Values"
            detail="Once in a lifetime"
            onPress={() => onOpen('values')}
          />
          <Row
            Icon={Ban}
            title="Anti-goals"
            detail="What you read when you don’t feel like it"
            onPress={() => onOpen('antiGoals')}
          />
          <Row
            Icon={Flag}
            title="Pratigya"
            detail={
              profile.pratigya
                ? `${PRATIGYAS[profile.pratigya].latin} · taken`
                : 'Not taken yet'
            }
            onPress={() => onOpen('pratigya')}
            last
          />
        </Section>
        <Section title="Focus">
          <Row
            Icon={Shield}
            title="App blocking"
            detail={`${deleted} apps deleted · re-install locks the app`}
          />
          <Row
            Icon={Bell}
            title="Session reminders"
            detail="The night before, if not sealed"
            last
            trailing={
              <Switch
                testID="reminders-toggle"
                value={profile.sessionReminders}
                onValueChange={on => {
                  haptics.selection();
                  profile.setSessionReminders(on);
                }}
                trackColor={{ true: colors.saffron, false: colors.hairline }}
                thumbColor={colors.white}
              />
            }
          />
        </Section>
        <Section title="Account">
          {/* TODO(devs): plan and billing once the paywall is decided. */}
          <Row
            Icon={Crown}
            title="Plan"
            detail="Laser Focus · free while in beta"
          />
          <Row
            Icon={Mail}
            title={profile.account?.phone ? 'Phone' : 'Email'}
            detail={contact}
          />
          <Row
            Icon={Languages}
            title="Language"
            detail="English · हिंदी soon"
          />
          <Row
            Icon={LogOut}
            title={confirmOut ? 'Tap again to sign out' : 'Sign out'}
            detail={
              confirmOut ? 'Your sheets stay in your account.' : undefined
            }
            danger={confirmOut}
            last
            onPress={() => {
              if (confirmOut) {
                onOpen('signOut');
              } else {
                haptics.warning();
                setConfirmOut(true);
              }
            }}
          />
        </Section>
      </Animated.View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <AppText variant="eyebrow">{title}</AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  Icon,
  title,
  detail,
  onPress,
  trailing,
  last,
  danger,
}: {
  Icon: React.FC<SvgProps>;
  title: string;
  detail?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  last?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={() => {
        haptics.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        width={20}
        height={20}
        color={danger ? colors.danger : colors.ink}
        strokeWidth={1.6}
      />
      <View style={styles.flex}>
        <AppText
          variant="heading"
          style={[styles.rowTitle, danger && { color: colors.danger }]}
        >
          {title}
        </AppText>
        {detail ? (
          <AppText variant="micro" style={styles.muted}>
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
  );
}

const RING = 96;
const RING_STROKE = 3;

/** The avatar inside a ring that fills as the run goes on. */
function DayRing({
  progress,
  children,
}: {
  progress: number;
  children: React.ReactNode;
}) {
  const r = (RING - RING_STROKE) / 2;
  const length = 2 * Math.PI * r;
  return (
    <View style={styles.ring}>
      <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          fill="none"
          stroke={colors.saffronLine}
          strokeWidth={RING_STROKE}
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          fill="none"
          stroke={colors.saffron}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={length * (1 - Math.max(0.02, progress))}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <View style={styles.avatar}>{children}</View>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <AppText style={styles.statValue}>{String(value)}</AppText>
      <AppText variant="micro" style={styles.muted}>
        {label}
      </AppText>
    </View>
  );
}

/** One day: filled for a full mark, half-filled for a half, a ring otherwise. */
function MarkDot({ mark, today }: { mark: DayMark; today: boolean }) {
  return (
    <View style={styles.dotCell}>
      <View
        style={[
          styles.dot,
          mark === 'full' && styles.dotFull,
          today && styles.dotToday,
        ]}
      >
        {mark === 'half' ? <View style={styles.dotHalf} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 28,
    backgroundColor: colors.parchment,
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: RING - 16,
    height: RING - 16,
    borderRadius: (RING - 16) / 2,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  avatarImage: {
    width: 140,
    height: 140,
    marginLeft: -34,
    marginTop: -44,
  },
  flex: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  muted: {
    color: colors.textMuted,
  },
  statsCard: {
    alignSelf: 'stretch',
    marginTop: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    borderRadius: 18,
    backgroundColor: colors.white,
    boxShadow: '0px 8px 20px rgba(60, 30, 10, 0.05)',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
  },
  statRule: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: colors.divider,
  },
  calendarHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    rowGap: 10,
  },
  dotCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    borderColor: colors.saffronLine,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  dotFull: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffron,
  },
  dotHalf: {
    height: '50%',
    backgroundColor: colors.saffron,
  },
  dotToday: {
    borderColor: colors.saffron,
    borderWidth: 1.6,
  },
  body: {
    padding: 22,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
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
  rowTitle: {
    fontSize: 15,
  },
});
