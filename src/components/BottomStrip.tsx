/**
 * Bottom chrome strip — RN port of `_BottomStrip` from `lib/main.dart`.
 *
 * Mirror of [TopBar]:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ [rosette]  Vara · shanivara         2083 SAMVAT       BHOPAL [rosette] │
 *   │            SHANI (Saturn)                            23.26°N        │
 *   └──────────────────────────────────────────────────────────────┘
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LOCATION } from '../config';
import { EngravedText } from './EngravedText';
import { VedicClockState } from '../models';
import { colors, glass } from '../theme';
import { YantraRosette } from './YantraRosette';
import { useResponsive } from '../hooks/useResponsive';

interface Props {
  state: VedicClockState;
}

export function BottomStrip({ state }: Props): JSX.Element {
  const responsive = useResponsive();
  const { scale, scaleFont, bottomStripHeight, isPortrait } = responsive;

  // Dynamic calculations
  const rosetteSize = Math.max(22, Math.min(42, 32 * scale));
  const horizontalGap = isPortrait ? 8 : 20 * scale;

  return (
    <View style={[styles.container, { height: bottomStripHeight, justifyContent: 'center', gap: 300 * scale }]}>
      {/* Block 1: Samvat */}
      <View style={[styles.cornerStack, { width: 380 * scale, transform: [{ translateY: -15 * scale }] }]}>
        <Image
          source={require('../../assets/images/corner_assest.png')}
          style={[styles.cornerBg, { width: 450 * scale, height: 260 * scale }]}
          resizeMode="stretch"
        />
        <View style={styles.cornerContent}>
          <EngravedText text={state.vikramSamvatYear.toString()} fontSize={28 * scale} />
          <Text style={[styles.bookendEn, { fontSize: 20 * scale, marginTop: 6 * scale, marginBottom: 6 * scale }]} numberOfLines={1}>
            विक्रम संवत्
          </Text>
        </View>
      </View>

      <View style={{ alignItems: 'center' }} />

      {/* Block 2: Location */}
      <View style={[styles.cornerStack, { width: 380 * scale, transform: [{ translateY: -15 * scale }] }]}>
        <Image
          source={require('../../assets/images/corner_assest.png')}
          style={[styles.cornerBg, { width: 450 * scale, height: 260 * scale }]}
          resizeMode="stretch"
        />
        <View style={styles.cornerContent}>
          <EngravedText text={LOCATION.cityHi} fontSize={28 * scale} />
          <Text style={[styles.bookendEn, { fontSize: 20 * scale, marginTop: 6 * scale, marginBottom: 6 * scale }]} numberOfLines={1}>
            {LOCATION.latitude.toFixed(2)}°N · {LOCATION.longitude.toFixed(2)}°E
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cornerStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBg: {
    position: 'absolute',
    width: 220,
    height: 146,
    opacity: 0.9,
  },
  cornerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    flexDirection: 'row',
  },
  block: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  middleBlock: {
    flex: 1.5,
  },
  cornerLeft: {
    position: 'absolute',
    opacity: 0.6,
  },
  cornerRight: {
    position: 'absolute',
    opacity: 0.6,
  },
  contentLeft: {
    paddingLeft: 12,
  },
  contentRight: {
    paddingRight: 12,
    alignItems: 'flex-end',
  },
  contentCenter: {
    alignItems: 'center',
  },
  captionLabel: {
    color: colors.inkMuted,
    letterSpacing: 1.5,
  },
  bookendHi: {
    color: colors.highlight,
    fontWeight: '600',
  },
  bookendEn: {
    color: colors.highlight,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  samvatLabelHi: {
    color: colors.giltLight,
    letterSpacing: 1,
  },
  samvatNumber: {
    color: colors.highlight,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  samvatLabelEn: {
    color: colors.inkMuted,
    letterSpacing: 2,
  },






});
