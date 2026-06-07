/**
 * Sunrise · daylight-duration · sunset strip — sits between [TopBar]
 * and the middle row so the user always sees today's exact rise/set
 * times for Bhopal in IST.
/**
 * Sunrise · daylight-duration · sunset strip — sits between [TopBar]
 * and the middle row so the user always sees today's exact rise/set
 * times for Bhopal in IST.
 *
 * Mirrors the Flutter Phase 5 layout. Times are formatted as
 * `HH:mm:ss IST` (24-hour, tabular nums) so the user gets sub-minute
 * precision without ambiguity.
 */

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { IST_OFFSET_MS } from '../config';
import { VedicClockState } from '../models';
import { colors, glass } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

interface Props {
  state: VedicClockState;
}

const SUN_ICON = require('../../assets/images/sun.png');
const MOON_ICON = require('../../assets/images/moon.png');

export function SunBar({ state }: Props): JSX.Element {
  const responsive = useResponsive();
  const { scale, scaleFont, sunBarHeight } = responsive;

  const rise = state.sunriseUtc;
  const set = state.sunsetUtc;

  // Dynamic calculations
  const iconSize = Math.max(16, Math.min(28, 24 * scale));
  const innerGap = Math.max(4, Math.min(12, 10 * scale));
  const containerGap = Math.max(8, Math.min(20, 16 * scale));

  return (
    <View style={[styles.container, { height: sunBarHeight, gap: containerGap }]}>
      {/* Block 1: Sunrise */}
      <View style={[styles.block, glass.panel, { gap: innerGap }]}>
        <Image 
          source={SUN_ICON} 
          style={[styles.icon, { width: iconSize, height: iconSize, mixBlendMode: 'screen' } as any]} 
          resizeMode="contain" 
        />
        <View style={styles.textStack}>
          <Text style={[styles.labelHi, { fontSize: scaleFont(9), lineHeight: scaleFont(12) }]}>सूर्योदय</Text>
          <Text style={[styles.value, { fontSize: scaleFont(13), lineHeight: scaleFont(16) }]}>{formatIst(rise)}</Text>
          <Text style={[styles.labelEn, { fontSize: scaleFont(7), lineHeight: scaleFont(10) }]}>SUNRISE</Text>
        </View>
      </View>



      {/* Block 3: Sunset */}
      <View style={[styles.block, glass.panel, { gap: innerGap }]}>
        <View style={[styles.textStack, { alignItems: 'flex-end' }]}>
          <Text style={[styles.labelHi, { fontSize: scaleFont(9), lineHeight: scaleFont(12) }]}>सूर्यास्त</Text>
          <Text style={[styles.value, { fontSize: scaleFont(13), lineHeight: scaleFont(16) }]}>{formatIst(set)}</Text>
          <Text style={[styles.labelEn, { fontSize: scaleFont(7), lineHeight: scaleFont(10) }]}>SUNSET</Text>
        </View>
        <Image 
          source={MOON_ICON} 
          style={[styles.icon, { width: iconSize, height: iconSize, mixBlendMode: 'screen' } as any]} 
          resizeMode="contain" 
        />
      </View>
    </View>
  );
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Returns `HH:mm:ss` for the given UTC instant interpreted as IST. */
function formatIst(utc: Date): string {
  const ist = new Date(utc.getTime() + IST_OFFSET_MS);
  return `${pad2(ist.getUTCHours())}:${pad2(ist.getUTCMinutes())}:${pad2(ist.getUTCSeconds())}`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  block: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  textStack: {
    justifyContent: 'center',
  },
  icon: {},
  labelHi: {
    color: colors.accent,
    fontWeight: '600',
  },
  labelEn: {
    color: colors.inkMuted,
    letterSpacing: 1.2,
  },
  value: {
    color: colors.highlight,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  daylight: {
    color: colors.giltLight,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
