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
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LocationConfig } from '../config';
import { EngravedText } from './EngravedText';
import { VedicClockState } from '../models';
import { colors, glass } from '../theme';
import { YantraRosette } from './YantraRosette';
import { useResponsive } from '../hooks/useResponsive';

interface Props {
  state: VedicClockState;
  location: LocationConfig;
  onChangeLocation?: () => void;
}

export function BottomStrip({ state, location, onChangeLocation }: Props): JSX.Element {
  const responsive = useResponsive();
  const { scale, scaleFont, bottomStripHeight, isPortrait } = responsive;

  // Dynamic calculations
  const rosetteSize = Math.max(22, Math.min(42, 32 * scale));
  const horizontalGap = isPortrait ? 8 : 20 * scale;

  const { width } = responsive;
  // Cap corner block width so it never overflows on small screens
  const cornerW = Math.min(380 * scale, width * 0.32);
  const cornerBgW = Math.min(450 * scale, width * 0.38);
  const cornerBgH = cornerBgW * (260 / 450);

  return (
    <View style={[styles.container, { height: bottomStripHeight, justifyContent: 'space-between', paddingHorizontal: 12 * scale }]}>
      {/* Block 1: Samvat */}
      <View style={[styles.cornerStack, { width: 260 * scale, transform: [{ translateY: -15 * scale }] }]}>
        <Image
          testID="yantra-rosette"
          source={require('../../assets/images/corner_assest.png')}
          style={[styles.cornerBg, { width: 280 * scale, height: 140 * scale }]}
          resizeMode="stretch"
        />
        <View style={styles.cornerContent}>
          <EngravedText text={state.vikramSamvatYear?.toString() ?? ''} fontSize={16 * scale} />
          <Text style={[styles.bookendEn, { fontSize: 11 * scale, marginTop: 4 * scale, marginBottom: 4 * scale }]} numberOfLines={1}>
            विक्रम संवत्
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Block 2: Location (tappable to change) */}
      <TouchableOpacity
        style={[styles.cornerStack, { width: 260 * scale, transform: [{ translateY: -15 * scale }] }]}
        onPress={onChangeLocation}
        activeOpacity={onChangeLocation ? 0.7 : 1}
      >
        <Image
          testID="yantra-rosette"
          source={require('../../assets/images/corner_assest.png')}
          style={[styles.cornerBg, { width: 280 * scale, height: 140 * scale }]}
          resizeMode="stretch"
        />
        <View style={styles.cornerContent}>
          <EngravedText text={location.cityHi} fontSize={16 * scale} />
          <Text style={[styles.bookendEn, { fontSize: 11 * scale, marginTop: 4 * scale, marginBottom: 4 * scale }]} numberOfLines={1}>
            {location.latitude.toFixed(2)}°N · {location.longitude.toFixed(2)}°E
          </Text>
        </View>
      </TouchableOpacity>
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
