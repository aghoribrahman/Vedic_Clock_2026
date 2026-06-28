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
import { LoadingScreen } from './src/components/LoadingScreen';
import { LocationPromptScreen } from './src/components/LocationPromptScreen';
import { useAssets } from 'expo-asset';
import { ALL_ASSETS } from './src/preloadAssets';
import { useVedicClock } from './src/hooks/useVedicClock';
import { useLocation } from './src/hooks/useLocation';
import { useResponsive } from './src/hooks/useResponsive';
import { colors } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Best-effort — don't crash if splash machinery isn't ready.
});

export default function App(): JSX.Element {
  const [assets, assetError] = useAssets(ALL_ASSETS);
  const assetsLoaded = !!assets;

  if (assetError) {
    console.error("Asset loading error:", assetError);
  }

  const [interLoaded, interError] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  if (interError) console.error("Inter font error:", interError);

  const [tiroLoaded, tiroError] = useTiro({
    TiroDevanagariHindi_400Regular,
  });
  if (tiroError) console.error("Tiro font error:", tiroError);

  const fontsLoaded = interLoaded && tiroLoaded;

  // Fallback to avoid infinite splash screen if something fails to load
  useEffect(() => {
    if (assetError || interError || tiroError) {
      console.warn("Forcing splash screen to hide due to load error");
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [assetError, interError, tiroError]);

  const { location, isLoading: locationLoading, saveLocation, clearLocation } = useLocation();

  // Hide splash screen when fonts and assets are fully loaded
  useEffect(() => {
    if (fontsLoaded && assetsLoaded && !locationLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, assetsLoaded, locationLoading]);

  // Support responsive landscape/portrait rotation + keep screen awake.
  useEffect(() => {
    ScreenOrientation.unlockAsync().catch(() => { });
    activateKeepAwakeAsync().catch(() => { });
  }, []);

  const state = useVedicClock();
  const responsive = useResponsive();
  const { width, height, isPortrait, spacing, tier, scale } = responsive;

  // Phase 1: Loading assets, fonts, and checking stored location
  if (!fontsLoaded || !assetsLoaded || locationLoading) {
    return <LoadingScreen />;
  }

  // Phase 2: No location saved yet — show the prompt
  if (!location) {
    return <LocationPromptScreen onLocationSelected={saveLocation} />;
  }

  // Dial sizing — maximize the dial while ensuring its full visual extent fits.
  // The SVG arches extend ~1.55× vertically and ~1.75× horizontally beyond
  // the dial's core bounding box. We compute the largest dial where everything
  // stays on screen — no clipping, no overflow.
  const idealSize = Math.min(width, height) * 0.95
    / (tier === 'mobile' ? 1.45 : tier === 'tablet' ? 1.65 : 2.0);
  const maxForWidth = width / 1.75;
  const maxForHeight = height / 1.55;
  const dialSize = Math.min(idealSize, maxForWidth, maxForHeight) * 0.95; // 5% smaller for breathing room

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {state && <LivingSkyBackdrop />}

      {state == null ? (
        <LoadingScreen />
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

          <View style={[styles.topSection, { top: isPortrait ? spacing : -10 }]}>
            <TopBar state={state} />
            {/* <SunBar state={state} /> */}
          </View>

          <View style={[styles.bottomSection, { bottom: spacing }]}>
            <BottomStrip state={state} location={location} onChangeLocation={clearLocation} />
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
    minWidth: 100,
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
