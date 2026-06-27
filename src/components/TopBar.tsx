/**
 * Top chrome bar — RN port of `_TopBar` from `lib/main.dart`.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ [rosette]  10:26 AM         tagline           25 अप्रैल 2026 [rosette] │
 *   │            10:26:31 IST                              SAT       │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Stack z-order: gilt gradient → rosette (watermarked) → text row.
 * The text row sits inset 88 px from each edge so the densest part of
 * each rosette has its own corner pocket and never sits under a glyph
 * — same fix we applied to the Flutter version in the final 8b pass.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { toIst } from '../config';
import { VedicClockState } from '../models';
import { colors, glass } from '../theme';
import { YantraRosette } from './YantraRosette';
import { useResponsive } from '../hooks/useResponsive';
import { EngravedText } from './EngravedText';

interface Props {
  state: VedicClockState;
}



export function TopBar({ state }: Props): JSX.Element {
  const responsive = useResponsive();
  const { scale, isPortrait, scaleFont, topBarHeight } = responsive;

  const istNow = toIst(state.nowUtc);
  const t12 = format12Hour(istNow);
  const t24 = format24Hour(istNow);
  const weekdayEn = WEEKDAY_EN_SHORT[istNow.getUTCDay()];
  const day = istNow.getUTCDate();
  const monthHi = MONTH_HI[istNow.getUTCMonth()];
  const year = istNow.getUTCFullYear();
  const dateStrHi = `${day} ${monthHi} ${year}`;

  const tagline = state.todayFestival
    ? `${state.todayFestival.nameHi} · ${state.todayFestival.nameEn}`
    : 'विक्रमादित्य वैदिक घड़ी';

  // Dynamic layout calculations
  const rosetteSize = Math.max(28, Math.min(52, 40 * scale));

  const sideStackWidth = isPortrait ? 90 * scale : 140 * scale;

  const { vara } = state.panchang;

  const { width } = responsive;
  // Cap corner block width so it never overflows on small screens
  const cornerW = Math.min(380 * scale, width * 0.32);
  const cornerBgW = Math.min(450 * scale, width * 0.38);
  const cornerBgH = cornerBgW * (260 / 450);

  return (
    <View style={[styles.container, glass.panel, { height: topBarHeight, paddingHorizontal: 12 * scale, marginTop: 40 * scale }]}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <View style={[styles.cornerStack, { width: 260 * scale }]}>
          <Image
            testID="yantra-rosette"
            source={require('../../assets/images/corner_assest.png')}
            style={[styles.cornerBg, { width: 280 * scale, height: 140 * scale }]}
            resizeMode="stretch"
          />
          <View style={styles.cornerContent}>
            <EngravedText text={t12} fontSize={16 * scale} />
            <Text style={[styles.timeSmall, { fontSize: 11 * scale, marginTop: 4 * scale, marginBottom: 4 * scale }]}>{`${t24} IST`}</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {state.todayFestival ? (
            <Text style={[styles.taglineFestival, { fontSize: scaleFont(14) }]} numberOfLines={1}>
              ✦  {tagline}  ✦
            </Text>
          ) : null}
        </View>
        <View style={[styles.cornerStack, { width: 260 * scale }]}>
          <Image
            testID="yantra-rosette"
            source={require('../../assets/images/corner_assest.png')}
            style={[styles.cornerBg, { width: 280 * scale, height: 140 * scale }]}
            resizeMode="stretch"
          />
          <View style={styles.cornerContent}>
            <EngravedText text={dateStrHi} fontSize={16 * scale} />
            <Text style={[styles.dateSmall, { fontSize: 11 * scale, marginTop: 4 * scale, marginBottom: 4 * scale }]} numberOfLines={1}>{vara.nameHi}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const WEEKDAY_EN_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const MONTH_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
function format24Hour(istWall: Date): string {
  return `${pad2(istWall.getUTCHours())}:${pad2(istWall.getUTCMinutes())}:${pad2(istWall.getUTCSeconds())}`;
}
function format12Hour(istWall: Date): string {
  const h = istWall.getUTCHours();
  const m = istWall.getUTCMinutes();
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad2(m)} ${period}`;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible',
  },
  cornerLeft: {
    position: 'absolute',
  },
  cornerRight: {
    position: 'absolute',
  },
  cornerStack: {

    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBg: {
    position: 'absolute',


    opacity: 0.9,
  },
  cornerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },


  tagline: { flex: 1, alignItems: 'center' },



  timeSmall: {
    color: colors.highlight,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
    fontVariant: ['tabular-nums'],
  },



  dateSmall: {
    color: colors.highlight,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  taglineTextPlain: {
    color: colors.highlightSoft,
    letterSpacing: 1.5,
    fontWeight: '500',
  },
  taglineFestival: {
    color: colors.accent,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  titleImage: {
    width: '100%',
    maxWidth: 1500,
  },
  pinstripe: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: 0.5,
    backgroundColor: colors.glassBorder,
  },
});
