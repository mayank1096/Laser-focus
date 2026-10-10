import React from 'react';
import { Switch, type SwitchProps } from 'react-native';
import { colors } from '../theme';

/** The app's switch: a black thumb on a saffron (on) or hairline (off) track. */
export function Toggle(props: Omit<SwitchProps, 'thumbColor' | 'trackColor'>) {
  return (
    <Switch
      {...props}
      trackColor={{ true: colors.saffron, false: colors.hairline }}
      thumbColor={colors.ink}
      // The browser preview keeps a separate colour for the "on" thumb.
      {...({ activeThumbColor: colors.ink } as object)}
    />
  );
}
