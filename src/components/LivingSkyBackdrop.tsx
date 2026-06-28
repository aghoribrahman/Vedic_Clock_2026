import React from 'react';
import { StyleSheet, View, Image, useWindowDimensions } from 'react-native';
import { computeSolarPhase, gradientForPhase } from '../core/skyGradient';

const BACKGROUND_IMAGE = require('../../assets/mainbg.png');

export const LivingSkyBackdrop = React.memo(function LivingSkyBackdrop(): JSX.Element {
  return (
    <View 
      style={styles.container} 
      pointerEvents="none" 
      testID="living-sky-backdrop"
    >
      <Image
        source={BACKGROUND_IMAGE}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        resizeMode="cover"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1B2A', // Theme bgDeep fallback
    zIndex: 0,
  },
});

export { computeSolarPhase, gradientForPhase };
