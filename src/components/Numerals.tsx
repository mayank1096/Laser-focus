import React, { Children, type ReactNode } from 'react';
import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { fonts } from '../theme/typography';

const DIGITS = /(\d[\d:.,/%]*)/;

/** Whether a text style resolves to the serif face. */
export const isSerif = (style: StyleProp<TextStyle>) =>
  StyleSheet.flatten(style)?.fontFamily === fonts.serif;

/**
 * Numbers always read in Google Sans, even inside serif lines: wraps each
 * run of digits in a nested sans span that inherits size and colour.
 */
export function sansDigits(children: ReactNode): ReactNode {
  return Children.map(children, child => {
    if (typeof child === 'number') {
      return <Text style={styles.num}>{child}</Text>;
    }
    if (typeof child !== 'string' || !DIGITS.test(child)) {
      return child;
    }
    return child.split(DIGITS).map((part, i) =>
      i % 2 === 1 ? (
        <Text key={i} style={styles.num}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
  });
}

const styles = StyleSheet.create({
  num: {
    fontFamily: fonts.sansMedium,
  },
});
