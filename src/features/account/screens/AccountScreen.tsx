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
import type { SvgProps } from 'react-native-svg';
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
import { colors, spacing } from '../../../theme';
import { haptics } from '../../../utils/haptics';
import { useGoalProgress, useRecentMarks } from '../../progress';
import { MarkGrid } from '../../session/components/MarkGrid';
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
  const marks = useRecentMarks(36).map(m => m.mark);
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
        <View style={styles.who}>
          <View style={styles.avatar}>
            <Image source={art.kneeling} style={styles.avatarImage} />
          </View>
          <View style={styles.flex}>
            <AppText variant="title" style={styles.name}>
              {profile.name || 'You'}
            </AppText>
            <AppText variant="label">{`Day ${progress.day}/${progress.days}`}</AppText>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(
                      100,
                      (progress.day / progress.days) * 100,
                    )}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
        <MarkGrid marks={marks} size={15} gap={4} />
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    gap: spacing.xxl,
    paddingHorizontal: 22,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.parchment,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink,
  },
  avatarImage: {
    width: 120,
    height: 120,
    marginLeft: -30,
    marginTop: -38,
  },
  flex: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontSize: 22,
    lineHeight: 26,
  },
  track: {
    height: 3,
    borderRadius: 2,
    marginTop: spacing.xs,
    backgroundColor: colors.saffronLine,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    backgroundColor: colors.saffron,
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
  muted: {
    color: colors.textMuted,
  },
});
