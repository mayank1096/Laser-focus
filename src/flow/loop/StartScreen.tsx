import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Check from '../../assets/icons/check.svg';
import ChevronDown from '../../assets/icons/chevron-down.svg';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SimpleScreen } from '../../components/SimpleScreen';
import { sessionsOn } from '../../core/home';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, motion, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';
import { SheetTitle } from '../components/SheetTitle';

type Tick = 'phone' | 'desk' | 'ready';

/**
 * The course's bare minimum before a session: three ticks, one tap each.
 * The full distraction checklist and the ritual are folded away below.
 */
export function StartScreen({ navigation, route }: RootScreenProps<'Start'>) {
  const t = useT();
  const session = useBook(s => s.sessions.find(x => x.id === route.params.id));
  const dayCount = useBook(s =>
    session ? sessionsOn(s, session.date).length : 0,
  );
  const [ticks, setTicks] = useState<Set<Tick>>(new Set());
  const [open, setOpen] = useState<'list' | 'ritual' | null>(null);
  const [notFeeling, setNotFeeling] = useState(false);
  if (!session) {
    return null;
  }
  const allTicked = ticks.size === 3;

  const toggle = (k: Tick) => {
    haptics.selection();
    setTicks(prev => {
      const next = new Set(prev);
      if (next.has(k)) {
        next.delete(k);
      } else {
        next.add(k);
      }
      return next;
    });
  };

  return (
    <>
      <SimpleScreen
        testID="start"
        onBack={() => navigation.goBack()}
        footer={
          <PrimaryButton
            testID="phone-out"
            label={t.start.go}
            disabled={!allTicked}
            onPress={() => {
              haptics.heavy();
              useBook.getState().startSession(session.id);
              navigation.replace('InProgress', { id: session.id });
            }}
          />
        }
      >
        <AppText variant="eyebrow">
          {t.start.header(session.order + 1, dayCount)}
        </AppText>
        <AppText style={[typography.title, styles.what]}>{session.what}</AppText>
        <View style={styles.outcome}>
          <AppText variant="eyebrow">{t.start.outcome}</AppText>
          <AppText variant="bodyMedium">{session.outcome}</AppText>
          <AppText variant="micro" style={styles.muted}>
            {t.common.minutes(session.minutes)}
          </AppText>
        </View>

        <View style={styles.ticks}>
          {(
            [
              ['phone', t.start.phoneOut],
              ['desk', t.start.deskOnly],
              ['ready', t.start.ready],
            ] as [Tick, string][]
          ).map(([k, label], i) => (
            <Pressable
              key={k}
              testID={`tick-${k}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ticks.has(k) }}
              onPress={() => toggle(k)}
              style={[styles.tick, i > 0 && styles.divided]}
            >
              <View style={[styles.box, ticks.has(k) && styles.boxOn]}>
                {ticks.has(k) ? (
                  <Check width={14} height={14} color={colors.white} strokeWidth={2.4} />
                ) : null}
              </View>
              <AppText variant="body" style={styles.flex}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Fold
          testID="fold-list"
          label={t.start.checklist}
          open={open === 'list'}
          onPress={() => setOpen(o => (o === 'list' ? null : 'list'))}
        >
          {t.start.checklistItems.map(item => (
            <AppText key={item} variant="body" style={styles.item}>
              {`·  ${item}`}
            </AppText>
          ))}
        </Fold>
        <Fold
          testID="fold-ritual"
          label={t.start.ritual}
          open={open === 'ritual'}
          onPress={() => setOpen(o => (o === 'ritual' ? null : 'ritual'))}
        >
          {t.start.ritualSteps.map((step, i) => (
            <AppText key={step} variant="body" style={styles.item}>
              {`${i + 1}.  ${step}`}
            </AppText>
          ))}
        </Fold>

        <Pressable
          testID="not-feeling"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setNotFeeling(true)}
          style={styles.notFeeling}
        >
          <AppText variant="label" style={styles.muted}>
            {t.start.notFeeling}
          </AppText>
        </Pressable>
      </SimpleScreen>

      <BottomSheet
        visible={notFeeling}
        onClose={() => setNotFeeling(false)}
        accessibilityLabel={t.start.notFeelingTitle}
      >
        <SheetTitle title={t.start.notFeelingTitle} />
        <View style={styles.answers}>
          <AppText variant="body">{`1.  ${t.start.notFeelingOne}`}</AppText>
          <AppText variant="body">{`2.  ${t.start.notFeelingTwo}`}</AppText>
        </View>
        <PrimaryButton
          label={t.start.backToStart}
          shadow="none"
          onPress={() => setNotFeeling(false)}
        />
      </BottomSheet>
    </>
  );
}

function Fold({
  label,
  open,
  onPress,
  children,
  testID,
}: {
  label: string;
  open: boolean;
  onPress: () => void;
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.fold}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          haptics.selection();
          onPress();
        }}
        style={styles.foldHead}
      >
        <AppText variant="bodyMedium" style={styles.flex}>
          {label}
        </AppText>
        <ChevronDown
          width={18}
          height={18}
          color={colors.textMuted}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(motion.base)} style={styles.foldBody}>
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  what: {
    marginTop: spacing.md,
  },
  outcome: {
    marginTop: spacing.xl,
    gap: spacing.xs,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.parchment,
  },
  ticks: {
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  tick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.4,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  flex: {
    flex: 1,
  },
  fold: {
    marginTop: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  foldHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  foldBody: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  item: {
    color: colors.textMuted,
  },
  notFeeling: {
    alignSelf: 'center',
    marginTop: 24,
  },
  muted: {
    color: colors.textMuted,
  },
  answers: {
    gap: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
