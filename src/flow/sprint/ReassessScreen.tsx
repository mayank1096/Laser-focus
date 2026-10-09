import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import { TextField } from '../../components/TextField';
import { useBook } from '../../core/store';
import { useT } from '../../i18n';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';

/**
 * After rest: what to keep doing, what not to, then either more of the same
 * goal or the next one. Both lead back through milestones and tasks to Plan.
 */
export function ReassessScreen({ navigation }: RootScreenProps<'Reassess'>) {
  const t = useT();
  const goals = useBook(s => s.goals);
  const [repeat, setRepeat] = useState('');
  const [dont, setDont] = useState('');

  // Rest is over once you're here, whenever it was meant to end.
  useEffect(() => {
    if (useBook.getState().restUntil) {
      useBook.getState().endRest();
    }
  }, []);

  const keepLessons = () => {
    if (repeat.trim() || dont.trim()) {
      useBook.getState().saveLessons(repeat.trim(), dont.trim());
    }
  };

  return (
    <SimpleScreen
      testID="reassess"
      tone="parchment"
      onBack={() => navigation.goBack()}
      footer={
        <View style={styles.footer}>
          <PrimaryButton
            testID="reassess-next"
            label={t.reassess.next}
            onPress={() => {
              keepLessons();
              haptics.tap();
              navigation.replace('Setup', { returnTo: 'reassess' });
            }}
          />
          <Pressable
            testID="reassess-continue"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              keepLessons();
              useBook.getState().continueGoal();
              haptics.tap();
              navigation.replace('Setup', {
                returnTo: 'reassess',
                step: 'milestones',
              });
            }}
            style={styles.link}
          >
            <AppText variant="label" style={styles.muted}>
              {t.reassess.continueGoal}
            </AppText>
          </Pressable>
        </View>
      }
    >
      <QuestionHeader eyebrow={t.reassess.title} title={t.reassess.ask} />
      <QuestionBody>
        <View style={styles.body}>
          <View style={styles.field}>
            <AppText variant="eyebrow">{t.reassess.repeat}</AppText>
            <TextField
              testID="lesson-repeat"
              accessibilityLabel={t.reassess.repeat}
              value={repeat}
              onChangeText={setRepeat}
              multiline
            />
          </View>
          <View style={styles.field}>
            <AppText variant="eyebrow">{t.reassess.dont}</AppText>
            <TextField
              testID="lesson-dont"
              accessibilityLabel={t.reassess.dont}
              value={dont}
              onChangeText={setDont}
              multiline
            />
          </View>
          <View style={styles.field}>
            <AppText variant="eyebrow">{t.reassess.goals}</AppText>
            <View style={styles.card}>
              {goals.map(g => (
                <View key={g.id} style={styles.goal}>
                  <AppText
                    variant="body"
                    style={[styles.flex, g.doneAt ? styles.muted : null]}
                  >
                    {g.text}
                  </AppText>
                  {g.doneAt ? (
                    <View style={styles.tag}>
                      <AppText variant="micro" style={styles.tagText}>
                        {t.reassess.reached}
                      </AppText>
                    </View>
                  ) : (
                    <AppText variant="micro" style={styles.muted}>
                      {t.goals.term(g.term)}
                    </AppText>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.group,
  },
  footer: {
    gap: spacing.lg,
  },
  link: {
    alignSelf: 'center',
  },
  muted: {
    color: colors.textMuted,
  },
  field: {
    gap: spacing.label,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.white,
    gap: spacing.xl,
  },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.ink,
  },
  tagText: {
    color: colors.white,
  },
});
