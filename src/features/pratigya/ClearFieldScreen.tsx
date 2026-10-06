import { DeleteButton } from '../../components/DeleteButton';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { art } from '../../assets/art';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { QuestionBody, QuestionHeader } from '../../components/QuestionHeader';
import { SimpleScreen } from '../../components/SimpleScreen';
import type { RootScreenProps } from '../../navigation/types';
import { colors, spacing } from '../../theme';
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
          {apps.map((a, i) => (
            <View key={a.name} style={[styles.row, i > 0 && styles.divided]}>
              <AppText
                variant="body"
                style={[styles.flex, a.deleted && styles.muted]}
              >
                {a.name}
              </AppText>
              <DeleteButton
                testID={`delete-${a.name}`}
                deleted={a.deleted}
                onDelete={() => markAppDeleted(a.name)}
              />
            </View>
          ))}
        </View>
      </QuestionBody>
    </SimpleScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingLeft: spacing.lg,
    paddingRight: spacing.md,
  },
  divided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  flex: {
    flex: 1,
  },
  muted: {
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
});
