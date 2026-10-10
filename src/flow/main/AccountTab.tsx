import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { art } from '../../assets/art';
import Ban from '../../assets/icons/ban.svg';
import Bell from '../../assets/icons/bell.svg';
import Flag from '../../assets/icons/flag.svg';
import Hourglass from '../../assets/icons/hourglass.svg';
import Languages from '../../assets/icons/languages.svg';
import LogOut from '../../assets/icons/log-out.svg';
import Mail from '../../assets/icons/mail.svg';
import Scroll from '../../assets/icons/scroll-text.svg';
import Settings from '../../assets/icons/settings.svg';
import Shield from '../../assets/icons/shield-check.svg';
import { AppText } from '../../components/AppText';
import { SettingsRow, SettingsSection } from '../../components/SettingsList';
import { rise } from '../../components/QuestionHeader';
import { TAB_BAR_CLEARANCE } from '../../components/TabBar';
import { appDay } from '../../core/days';
import { dayMark, sprintProgress } from '../../core/home';
import { useBook } from '../../core/store';
import { PRATIGYAS, useProfile } from '../../features/account/store';
import { useT } from '../../i18n';
import { clock } from '../../i18n/format';
import { colors, fonts, spacing } from '../../theme';
import { addDays } from '../../utils/date';
import { haptics } from '../../utils/haptics';
import { MarkHeatmap } from '../components/MarkHeatmap';

export type AccountDestination =
  | 'values'
  | 'antiGoal'
  | 'pratigya'
  | 'settings'
  | 'signOut';

export function AccountTab({
  onOpen,
}: {
  onOpen: (to: AccountDestination) => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const state = useBook();
  const today = appDay();
  const p = sprintProgress(state, today);
  const [confirmOut, setConfirmOut] = useState(false);

  let full = 0;
  let half = 0;
  for (let d = p.start; d <= today; d = addDays(d, 1)) {
    const m = dayMark(state, d);
    full += m === 'full' ? 1 : 0;
    half += m === 'half' ? 1 : 0;
  }
  const deleted = profile.apps.filter(a => a.deleted).length;
  const phone = profile.account?.phone
    ? `+${profile.account.phone.slice(0, 2)} ${profile.account.phone.slice(
        2,
        7,
      )} ${profile.account.phone.slice(7)}`
    : profile.account?.email ?? '';
  const vow = profile.pratigya ? PRATIGYAS[profile.pratigya].latin : null;

  return (
    <ScrollView
      testID="account"
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
        <DayRing progress={Math.min(1, p.day / p.days)}>
          <Image source={art.kneeling} style={styles.avatarImage} />
        </DayRing>
        <AppText variant="title" style={styles.name}>
          {profile.name || p.goal?.text || ''}
        </AppText>
        <AppText variant="label" style={styles.muted}>
          {[t.account.day(p.day, p.days), vow].filter(Boolean).join(' · ')}
        </AppText>

        <View style={styles.statsCard}>
          <View style={styles.stats}>
            <Stat value={full} label={t.account.full} />
            <View style={styles.statRule} />
            <Stat value={half} label={t.account.half} />
            <View style={styles.statRule} />
            <Stat value={p.left} label={t.account.left} />
          </View>
          <View style={styles.calendarHead}>
            <AppText variant="eyebrow">{t.account.marks}</AppText>
            <View style={styles.legend}>
              <View style={[styles.key, styles.keyHalf]} />
              <AppText variant="micro" style={styles.muted}>
                {t.account.legendHalf}
              </AppText>
              <View style={[styles.key, styles.keyFull]} />
              <AppText variant="micro" style={styles.muted}>
                {t.account.legendFull}
              </AppText>
            </View>
          </View>
          <MarkHeatmap book={state} runStart={p.start} />
        </View>
      </Animated.View>

      <Animated.View entering={rise(1)} style={styles.body}>
        <SettingsSection title={t.account.lifetime}>
          <SettingsRow
            testID="account-values"
            Icon={Scroll}
            title={t.account.values}
            detail={t.account.valuesSub}
            onPress={() => onOpen('values')}
          />
          <SettingsRow
            testID="account-antigoal"
            Icon={Ban}
            title={t.account.antiGoal}
            detail={t.account.antiGoalSub}
            onPress={() => onOpen('antiGoal')}
          />
          <SettingsRow
            Icon={Flag}
            title={t.account.pratigya}
            detail={vow ? t.account.taken(vow) : undefined}
            onPress={() => onOpen('pratigya')}
            last
          />
        </SettingsSection>
        <SettingsSection title={t.account.focus}>
          <SettingsRow
            testID="account-rhythm"
            Icon={Hourglass}
            title={t.account.rhythm}
            detail={`${state.rhythm.slots
              .map(x => clock(t, x.start))
              .join(', ')} · ${t.common.days[state.rhythm.reviewDay]}`}
            onPress={() => onOpen('settings')}
          />
          <SettingsRow
            Icon={Bell}
            title={t.account.reminder}
            detail={
              state.rhythm.reminderOn
                ? t.account.reminderOn(clock(t, state.rhythm.reminderAt))
                : t.account.reminderOff
            }
            trailing={
              <Switch
                testID="reminders-toggle"
                value={state.rhythm.reminderOn}
                onValueChange={on => {
                  haptics.selection();
                  state.setRhythm({ reminderOn: on });
                }}
                trackColor={{ true: colors.saffron, false: colors.hairline }}
                thumbColor={colors.white}
              />
            }
          />
          <SettingsRow
            Icon={Shield}
            title={t.account.blocking}
            detail={t.account.blockingSub(deleted)}
            last
          />
        </SettingsSection>
        <SettingsSection title={t.account.accountSection}>
          {phone ? (
            <SettingsRow
              Icon={Mail}
              title={profile.account?.phone ? t.account.phone : t.signIn.email}
              detail={phone}
            />
          ) : null}
          <SettingsRow
            testID="account-language"
            Icon={Languages}
            title={t.account.language}
            detail={t.account.languageName}
            trailing={
              <AppText variant="label" style={styles.switchLang}>
                {profile.language === 'en' ? 'हिंदी' : 'English'}
              </AppText>
            }
            onPress={() =>
              profile.setLanguage(profile.language === 'en' ? 'hi' : 'en')
            }
          />
          <SettingsRow
            testID="account-settings"
            Icon={Settings}
            title={t.settings.title}
            detail={`${t.account.how} · ${t.account.export}`}
            onPress={() => onOpen('settings')}
          />
          <SettingsRow
            testID="sign-out"
            Icon={LogOut}
            title={confirmOut ? t.account.signOutSure : t.account.signOut}
            detail={confirmOut ? t.account.signOutSub : undefined}
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
        </SettingsSection>
      </Animated.View>
    </ScrollView>
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
    gap: spacing.sm,
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
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  key: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginLeft: 4,
  },
  keyHalf: {
    backgroundColor: '#FBC48F',
  },
  keyFull: {
    backgroundColor: colors.saffron,
  },
  body: {
    padding: 22,
    gap: spacing.xxl,
  },
  switchLang: {
    color: colors.saffron,
  },
});
