import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function EngravedText({ text, fontSize }: { text: string; fontSize: number }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: fontSize * 1.5 }}>
      {/* Outer soft fog glow */}
      <Text style={[styles.baseText, { fontSize, textShadowRadius: 12, textShadowColor: 'rgba(255, 140, 0, 0.5)', textShadowOffset: { width: 0, height: 0 } }]}>
        {text}
      </Text>
      {/* Deep shadow simulating the carved recess */}
      <Text style={[styles.baseText, { position: 'absolute', fontSize, textShadowRadius: 2, textShadowColor: 'rgba(0,0,0,0.95)', textShadowOffset: { width: 0, height: 2 } }]}>
        {text}
      </Text>
      {/* Bright illuminated face */}
      <Text style={[styles.baseText, { position: 'absolute', fontSize, color: '#FFF5D1', textShadowColor: 'rgba(255, 255, 255, 0.4)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 0 } }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseText: {
    color: '#FFE8A1',
    fontWeight: 'bold',
    letterSpacing: 2,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  }
});
