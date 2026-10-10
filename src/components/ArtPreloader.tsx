import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { art } from '../assets/art';

/**
 * Draws every illustration once, invisibly, as the app opens, so each
 * onboarding page finds its art already decoded instead of popping it in
 * after the page has landed.
 */
export function ArtPreloader() {
  return (
    <View style={styles.hidden} pointerEvents="none" aria-hidden>
      {Object.values(art).map((source, i) => (
        <Image key={i} source={source} style={styles.image} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  image: {
    width: 1,
    height: 1,
  },
});
