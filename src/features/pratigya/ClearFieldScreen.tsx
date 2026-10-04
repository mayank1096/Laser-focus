import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, radii, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';
import { useProfile } from '../account/store';
import { VOW_STEPS } from './PathScreen';

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five'];

/**
 * TODO(devs): "Delete" opens the system uninstall prompt for that package
 * (Android ACTION_DELETE) or the app's Settings page on iOS; "Check again"
 * re-scans installed apps.
 */
export function ClearFieldScreen({
  navigation,
}: RootScreenProps<'ClearField'>) {
  const apps = useProfile(s => s.apps);
  const markAppDeleted = useProfile(s => s.markAppDeleted);
  const left = apps.filter(a => !a.deleted).length;

  return (
    <SimpleScreen
      testID="clear-field"
      art={art.kneeling}
      progress={{ total: VOW_STEPS, filled: 5 }}
      onBack={() => navigation.goBack()}
      footer={
        <PrimaryButton
          testID="next-button"
          label={left ? 'Check again' : 'Next'}
          disabled={left > 0}
          onPress={() => navigation.navigate('TakeVow')}
        />
      }
    >
      <QuestionHeader
        eyebrow="Clear the field"
        title={
          left === 0
            ? 'The field is clear.'
            : `${WORDS[left] ?? left} ${
                left === 1 ? 'distraction is' : 'distractions are'
              } still on your phone.`
        }
        subtitle="Delete them from your home screen. We check the moment you’re back."
      />
      <QuestionBody gap={26}>
        <View style={styles.list}>
          {apps.map(a => (
            <View key={a.name} style={[styles.row, a.deleted && styles.gone]}>
              <AppText
                variant="body"
                style={[styles.flex, a.deleted && styles.muted]}
              >
                {a.name}
              </AppText>
              {a.deleted ? (
                <AppText variant="label" style={styles.muted}>
                  Deleted
                </AppText>
              ) : (
                <Pressable
                  testID={`delete-${a.name}`}
                  accessibilityRole="button"
                  hitSlop={6}
                  style={styles.pill}
                  onPress={() => {
                    haptics.confirm();
                    markAppDeleted(a.name);
                  }}
                >
                  <AppText variant="label" style={styles.saffron}>
                    Delete
                  </AppText>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  gone: {
    borderColor: colors.divider,
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: colors.textFaint,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.saffron,
  },
  saffron: {
    color: colors.saffron,
  },
});
