/**
 * Vikramaditya Vedic Clock — root screen.
 *
 * Layout (landscape):
 *
 *  ┌────────────────────────────────────────────────────────────────┐
 *  │ TopBar (time · tagline · date)                                 │
 *  ├──────────────┬───────────────────────────────┬─────────────────┤
 *  │              │                               │                 │
 *  │  LeftWing    │           DialCore            │   RightWing     │
 *  │  (tithi /    │       (30 wedges + hero       │  (sun rashi /   │
 *  │   nakshatra) │        MM : KK : KK)          │   yoga / karana)│
 *  │              │                               │                 │
 *  ├──────────────┴───────────────────────────────┴─────────────────┤
 *  │ BottomStrip (vara · samvat · location)                         │
 *  └────────────────────────────────────────────────────────────────┘
 *
 * Stack z-order: LivingSkyBackdrop → chrome bars + wings + dial.
 * The screen is locked to landscape via expo-screen-orientation
 * (kiosk usage on a TV / wall-mounted tablet).
 */

import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts as useTiro, TiroDevanagariHindi_400Regular } from '@expo-google-fonts/tiro-devanagari-hindi';
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { BottomStrip } from './src/components/BottomStrip';
import { DialCore } from './src/components/DialCore';
import { LivingSkyBackdrop } from './src/components/LivingSkyBackdrop';
import { SunBar } from './src/components/SunBar';
// import { LeftWing, RightWing } from './src/components/Wings';
import { TopBar } from './src/components/TopBar';
import { useVedicClock } from './src/hooks/useVedicClock';
import { useResponsive } from './src/hooks/useResponsive';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Best-effort — don't crash if splash machinery isn't ready.
});

export default function App(): JSX.Element {
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [tiroLoaded] = useTiro({
    TiroDevanagariHindi_400Regular,
  });
  const fontsLoaded = interLoaded && tiroLoaded;

  const onLayoutRoot = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => { });
    }
  }, [fontsLoaded]);

  // Support responsive landscape/portrait rotation + keep screen awake.
  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => { });
    activateKeepAwakeAsync().catch(() => { });
  }, []);

  const state = useVedicClock();
  const responsive = useResponsive();
  const { width, height, isPortrait, spacing } = responsive;

  if (!fontsLoaded) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.highlight} />
      </View>
    );
  }

  // Dial & Wing fitting computations
  const wingWidth = isPortrait
    ? (width - spacing * 3) / 2
    : Math.min(220, width * 0.2) * responsive.scale;

  // Force dial to 95% of available physical space
  const maxDialPhysicalSize = Math.min(width, height) * 0.95;
  const dialSize = maxDialPhysicalSize / 1.70;

  return (
    <View style={styles.root} onLayout={onLayoutRoot}>
      <StatusBar hidden />
      {state && <LivingSkyBackdrop state={state} />}

      {state == null ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.highlight} />
        </View>
      ) : (
        <View style={[styles.body, { padding: 0 }]}>
          {isPortrait ? (
            <View style={[styles.middlePortrait, { gap: spacing }]}>
              <View style={styles.dialColumn}>
                <DialCore state={state} size={dialSize} />
              </View>
            </View>
          ) : (
            <View style={[styles.middle, { gap: spacing }]}>
              <View style={styles.dialColumn}>
                <DialCore state={state} size={dialSize} />
              </View>
            </View>
          )}

          <View style={[styles.topSection, { top: spacing }]}>
            <TopBar state={state} />
            {/* <SunBar state={state} /> */}
          </View>

          <View style={[styles.bottomSection, { bottom: spacing }]}>
            <BottomStrip state={state} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    position: 'absolute',
    width: '100%',
    zIndex: 10,
  },
  middle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  middlePortrait: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  wingsRowPortrait: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  bottomSection: {
    position: 'absolute',
    width: '100%',
    zIndex: 10,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgDeep,
  },
});
