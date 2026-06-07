/**
 * The big MM : KK : KK readout — now using high-resolution custom digit images
 * with smooth slide-down rolling animations powered by React Native's Animated API.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';

const NUMBER_IMAGES: { [key: string]: any } = {
  '0': require('../../assets/numbers/0.png'),
  '1': require('../../assets/numbers/1.png'),
  '2': require('../../assets/numbers/2.png'),
  '3': require('../../assets/numbers/3.png'),
  '4': require('../../assets/numbers/4.png'),
  '5': require('../../assets/numbers/5.png'),
  '6': require('../../assets/numbers/6.png'),
  '7': require('../../assets/numbers/7.png'),
  '8': require('../../assets/numbers/8.png'),
  '9': require('../../assets/numbers/9.png'),
};

interface AnimatedDigitProps {
  digit: string;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}

function AnimatedDigit({ digit, width, height, style }: AnimatedDigitProps): React.JSX.Element {
  const [prevDigit, setPrevDigit] = useState<string>(digit);
  const [currDigit, setCurrDigit] = useState<string>(digit);

  // animValue: 0 means start of transition (rendering prev), 1 means complete (rendering curr)
  const animValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (digit !== currDigit) {
      // Initiate transition: set prevDigit to what currDigit was, and currDigit to the new digit
      setPrevDigit(currDigit);
      setCurrDigit(digit);
      animValue.setValue(0);

      Animated.timing(animValue, {
        toValue: 1,
        duration: 350, // snappy, premium transition speed
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [digit, currDigit, animValue]);

  // Interpolations for the old digit (vanishes at the bottom)
  const prevTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height],
  });
  const prevOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  // Interpolations for the new digit (comes from the top)
  const currTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-height, 0],
  });
  const currOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[{ width, height, overflow: 'hidden', position: 'relative' }, style]}>
      {/* If transitioning, render the previous digit sliding down */}
      {prevDigit !== currDigit && (
        <Animated.Image
          source={NUMBER_IMAGES[prevDigit]}
          style={{
            position: 'absolute',
            width,
            height,
            opacity: prevOpacity,
            transform: [{ translateY: prevTranslateY }],
          }}
          resizeMode="contain"
        />
      )}

      {/* Render the current/new digit */}
      <Animated.Image
        source={NUMBER_IMAGES[currDigit]}
        style={{
          position: 'absolute',
          width,
          height,
          opacity: currOpacity,
          transform: [{ translateY: currTranslateY }],
        }}
        resizeMode="contain"
      />
    </View>
  );
}

interface Props {
  text: string;
  big?: boolean;
  scale?: number;
}

export function HeroDigits({ text, big = false, scale = 1 }: Props): React.JSX.Element {
  const digits = text.split('');
  const height = (big ? 112 : 98) * scale * 1.0;
  const width = height * 0.7; // Proportional width for beautiful layout

  return (
    <View style={styles.row}>
      {digits.map((char, index) => (
        <AnimatedDigit
          key={index}
          digit={char}
          width={width}
          height={height}
          style={{
            marginHorizontal: -width * 0.16, // Tighter kerning
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
