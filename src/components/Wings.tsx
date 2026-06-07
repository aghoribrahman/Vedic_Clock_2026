import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { VedicClockState } from '../models';
import { colors } from '../theme';
import { useResponsive } from '../hooks/useResponsive';
import { EngravedText } from './EngravedText';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function EnergyArc({ progress, width, label, breatheAnim, suffix = '' }: { progress: number; width: number; label: string; breatheAnim: Animated.Value; suffix?: string }) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const r = width / 2;
  const strokeWidth = 2.5;

  // 180-degree bottom cradle arc
  const dBase = `M ${strokeWidth},${r} A ${r - strokeWidth},${r - strokeWidth} 0 0,0 ${width - strokeWidth},${r}`;

  const circumference = Math.PI * (r - strokeWidth);
  const dashoffset = circumference - (safeProgress * circumference);

  return (
    <View style={{ alignItems: 'center', width, marginTop: 4 }}>
      {/* Dynamic Glow Cradle */}
      <Svg width={width} height={r + strokeWidth} style={{ position: 'absolute', bottom: -5 }}>
        <Defs>
          <LinearGradient id="arcGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgba(218, 165, 32, 0.05)" />
            <Stop offset="50%" stopColor="rgba(255, 223, 0, 1)" />
            <Stop offset="100%" stopColor="rgba(218, 165, 32, 0.05)" />
          </LinearGradient>
        </Defs>
        {/* Dim track */}
        <Path d={dBase} stroke="rgba(255, 255, 255, 0.1)" strokeWidth={strokeWidth} fill="none" />

        {/* Glowing Progress Fill */}
        <AnimatedPath
          d={dBase}
          stroke="url(#arcGlow)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          opacity={breatheAnim}
        />
      </Svg>

      {/* Modern Numeric Text cradled in the arc */}
      <Animated.Text style={{
        color: colors.highlightSoft,
        fontWeight: '300',
        fontSize: width * 0.18,
        letterSpacing: 2,
        fontVariant: ['tabular-nums'],
        opacity: breatheAnim.interpolate({ inputRange: [0.6, 1], outputRange: [0.7, 1] }),
        textShadowColor: 'rgba(218, 165, 32, 0.5)',
        textShadowRadius: 4,
        marginBottom: 2,
      }}>
        {label}
        {suffix ? <Text style={{ fontSize: width * 0.10, opacity: 0.6 }}>{suffix}</Text> : null}
      </Animated.Text>
    </View>
  );
}

// ==========================================
// Wing Panels
// ==========================================

export function LeftWing({ state }: { state: VedicClockState }): JSX.Element {
  const { scale, scaleFont } = useResponsive();
  const y = state.panchang.yoga;

  // Ambient breathing animation
  const breatheAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(breatheAnim, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>



      <View style={styles.content}>
        {/* Category & Meaning */}
        <EngravedText text={`योग : ${y.nameHi}`} fontSize={scaleFont(18)} />

        <View style={{ height: 4 * scale }} />

        {/* State/Progress */}
        <EnergyArc
          progress={y.progressFraction}
          width={70 * scale}
          label={`${(y.progressFraction * 100).toFixed(0)}`}
          suffix="%"
          breatheAnim={breatheAnim}
        />
      </View>
    </View>
  );
}

export function RightWing({ state }: { state: VedicClockState }): JSX.Element {
  const { scale, scaleFont } = useResponsive();
  const k = state.panchang.karana;

  // Ambient breathing animation
  const breatheAnim = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, { toValue: 1, duration: 3000, useNativeDriver: true, delay: 500 }), // Slightly offset from LeftWing
        Animated.timing(breatheAnim, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>

      <View style={styles.content}>
        {/* Category & Meaning */}
        <EngravedText text={`करण : ${k.nameHi}`} fontSize={scaleFont(18)} />

        {/* Subtle sub-meaning */}
        <Text style={[styles.subtitle, { fontSize: scaleFont(9) }]}>{k.isFixed ? 'स्थिर' : 'चर'}</Text>

        <View style={{ height: 4 * scale }} />

        {/* State/Progress */}
        <EnergyArc
          progress={k.slot / 60}
          width={70 * scale}
          label={`${k.slot}`}
          suffix="/60"
          breatheAnim={breatheAnim}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -20, // Optical balance for the arch base
  },

  subtitle: {
    color: colors.highlight,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
    includeFontPadding: false,
  },
});
