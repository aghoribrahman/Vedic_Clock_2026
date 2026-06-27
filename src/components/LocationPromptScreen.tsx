/**
 * LocationPromptScreen — shown once on first launch when no saved
 * location is found. Offers two paths:
 *   1. "Use Current Location" — requests GPS via expo-location
 *   2. "Enter Manually" — text inputs for latitude & longitude
 *
 * Styled to match the Vedic Clock's premium dark-gold aesthetic.
 * All sizing is responsive via useResponsive().
 */

import React, { useState, useMemo } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { LocationConfig, DEFAULT_LOCATION } from '../config';
import { colors } from '../theme';
import { useResponsive } from '../hooks/useResponsive';

interface Props {
  onLocationSelected: (loc: LocationConfig) => void;
}

export function LocationPromptScreen({ onLocationSelected }: Props): JSX.Element {
  const { scale } = useResponsive();
  const [showManual, setShowManual] = useState(false);
  const [cityName, setCityName] = useState('');
  const [latText, setLatText] = useState('');
  const [lonText, setLonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Spinner animation for the GPS loading state
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const s = useMemo(() => getStyles(scale), [scale]);

  async function handleGPS() {
    setErrorMessage(null);
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Location permission denied. Please enter your coordinates manually below.');
        setShowManual(true);
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Try reverse geocoding to get city name
      let city = `${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`;
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (place?.city) {
          city = place.city;
        } else if (place?.subregion) {
          city = place.subregion;
        }
      } catch {
        // Offline — fall back to coordinate string
      }

      const loc: LocationConfig = {
        city,
        cityHi: city,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        heightMeters: pos.coords.altitude ?? DEFAULT_LOCATION.heightMeters,
      };
      onLocationSelected(loc);
    } catch (e) {
      setErrorMessage('Unable to fetch location. Please enter your coordinates manually or check your device settings.');
      setShowManual(true);
      console.warn('LocationPromptScreen: GPS error', e);
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit() {
    setErrorMessage(null);
    const lat = parseFloat(latText);
    const lon = parseFloat(lonText);
    if (isNaN(lat) || isNaN(lon) || latText.trim() === '' || lonText.trim() === '') {
      setErrorMessage('Please enter valid numbers for both latitude and longitude.');
      return;
    }
    if (lat < 6 || lat > 38 || lon < 68 || lon > 98) {
      setErrorMessage('Coordinates are outside India. Please enter values within Lat: 6°–38°N, Lon: 68°–98°E.');
      return;
    }
    const city = cityName.trim() || `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`;
    const loc: LocationConfig = {
      city,
      cityHi: city,
      latitude: lat,
      longitude: lon,
      heightMeters: DEFAULT_LOCATION.heightMeters,
    };
    onLocationSelected(loc);
  }

  if (loading) {
    const ringSize = 80 * scale;
    const innerSize = 68 * scale;
    return (
      <View style={s.container}>
        <Animated.View
          style={[{
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 6 * scale,
            borderColor: colors.bgLiftHi,
            borderTopColor: colors.highlight,
            borderRightColor: colors.highlightSoft,
            position: 'absolute',
          }, { transform: [{ rotate: spin }] }]}
        />
        <View style={{
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: colors.bgDeep,
          position: 'absolute',
        }} />
        <Text style={s.loadingText}>Fetching Location...</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Title */}
      <Text style={s.title}>विक्रमादित्य वैदिक घड़ी</Text>
      <Text style={s.subtitle}>Set Your Location</Text>
      <Text style={s.description}>
        The clock needs your location to calculate accurate sunrise, sunset, and panchang timings.
      </Text>

      {/* Inline Error Banner */}
      {errorMessage && (
        <View style={s.errorBanner}>
          <Text style={s.errorIcon}>⚠️</Text>
          <Text style={s.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* GPS Button */}
      <TouchableOpacity testID="gps-button" style={s.gpsButton} onPress={handleGPS} activeOpacity={0.8}>
        <Text style={s.gpsButtonIcon}>📍</Text>
        <Text style={s.gpsButtonText}>Use Current Location</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>OR</Text>
        <View style={s.dividerLine} />
      </View>

      {/* Manual Entry */}
      {!showManual ? (
        <TouchableOpacity
          style={s.manualToggle}
          onPress={() => setShowManual(true)}
          activeOpacity={0.8}
        >
          <Text style={s.manualToggleText}>Enter Coordinates Manually</Text>
        </TouchableOpacity>
      ) : (
        <View style={s.manualForm}>
          <View style={s.inputRow}>
            <Text style={s.inputLabel}>City Name</Text>
            <TextInput
              style={s.input}
              value={cityName}
              onChangeText={(t) => { setCityName(t); setErrorMessage(null); }}
              placeholder="e.g. Indore"
              placeholderTextColor={colors.inkMuted}
              returnKeyType="next"
            />
          </View>
          <View style={s.inputRow}>
            <Text style={s.inputLabel}>Latitude (°N)</Text>
            <TextInput
              style={s.input}
              value={latText}
              onChangeText={(t) => { setLatText(t); setErrorMessage(null); }}
              placeholder="e.g. 22.7196"
              placeholderTextColor={colors.inkMuted}
              keyboardType="numeric"
              returnKeyType="next"
            />
          </View>
          <View style={s.inputRow}>
            <Text style={s.inputLabel}>Longitude (°E)</Text>
            <TextInput
              style={s.input}
              value={lonText}
              onChangeText={(t) => { setLonText(t); setErrorMessage(null); }}
              placeholder="e.g. 75.8577"
              placeholderTextColor={colors.inkMuted}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            style={s.submitButton}
            onPress={handleManualSubmit}
            activeOpacity={0.8}
          >
            <Text style={s.submitButtonText}>Set Location</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/** Generates fully scaled styles from the responsive scale factor. */
function getStyles(scale: number) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
      paddingHorizontal: 32 * scale,
    },
    title: {
      fontFamily: 'TiroDevanagariHindi_400Regular',
      fontSize: 32 * scale,
      color: colors.highlight,
      marginBottom: 8 * scale,
      textShadowColor: 'rgba(232, 185, 75, 0.3)',
      textShadowOffset: { width: 0, height: 2 * scale },
      textShadowRadius: 8 * scale,
    },
    subtitle: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 22 * scale,
      color: colors.ink,
      marginBottom: 12 * scale,
      letterSpacing: 1 * scale,
    },
    description: {
      fontFamily: 'Inter_400Regular',
      fontSize: 14 * scale,
      color: colors.inkMuted,
      textAlign: 'center',
      maxWidth: 400 * scale,
      marginBottom: 40 * scale,
      lineHeight: 20 * scale,
    },
    gpsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgLiftHi,
      borderWidth: 1.5 * scale,
      borderColor: colors.highlight,
      borderRadius: 14 * scale,
      paddingVertical: 16 * scale,
      paddingHorizontal: 32 * scale,
      marginBottom: 24 * scale,
      shadowColor: colors.highlight,
      shadowOffset: { width: 0, height: 4 * scale },
      shadowOpacity: 0.25,
      shadowRadius: 12 * scale,
      elevation: 6,
    },
    gpsButtonIcon: {
      fontSize: 22 * scale,
      marginRight: 12 * scale,
    },
    gpsButtonText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18 * scale,
      color: colors.highlight,
      letterSpacing: 0.5 * scale,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24 * scale,
      width: '80%',
      maxWidth: 350 * scale,
    },
    dividerLine: {
      flex: 1,
      height: 1 * scale,
      backgroundColor: colors.pinstripe,
    },
    dividerText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13 * scale,
      color: colors.inkMuted,
      marginHorizontal: 16 * scale,
      letterSpacing: 2 * scale,
    },
    manualToggle: {
      borderWidth: 1 * scale,
      borderColor: colors.glassBorder,
      borderRadius: 14 * scale,
      paddingVertical: 14 * scale,
      paddingHorizontal: 28 * scale,
    },
    manualToggleText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 16 * scale,
      color: colors.inkMuted,
      letterSpacing: 0.5 * scale,
    },
    manualForm: {
      width: '100%',
      maxWidth: 380 * scale,
      alignItems: 'center',
    },
    inputRow: {
      width: '100%',
      marginBottom: 16 * scale,
    },
    inputLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13 * scale,
      color: colors.inkMuted,
      marginBottom: 6 * scale,
      letterSpacing: 1 * scale,
      textTransform: 'uppercase',
    },
    input: {
      fontFamily: 'Inter_400Regular',
      fontSize: 18 * scale,
      color: colors.ink,
      borderWidth: 1.5 * scale,
      borderColor: colors.glassBorderHi,
      borderRadius: 10 * scale,
      backgroundColor: colors.bgLift,
      paddingVertical: 14 * scale,
      paddingHorizontal: 16 * scale,
    },
    submitButton: {
      backgroundColor: colors.highlight,
      borderRadius: 14 * scale,
      paddingVertical: 14 * scale,
      paddingHorizontal: 40 * scale,
      marginTop: 8 * scale,
      shadowColor: colors.highlight,
      shadowOffset: { width: 0, height: 4 * scale },
      shadowOpacity: 0.3,
      shadowRadius: 10 * scale,
      elevation: 6,
    },
    submitButtonText: {
      fontFamily: 'Inter_700Bold',
      fontSize: 17 * scale,
      color: colors.bgDeep,
      letterSpacing: 1 * scale,
    },
    loadingText: {
      marginTop: 120 * scale,
      fontFamily: 'Inter_500Medium',
      fontSize: 20 * scale,
      color: colors.highlight,
      letterSpacing: 1 * scale,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(192, 72, 72, 0.15)',
      borderWidth: 1 * scale,
      borderColor: colors.ashubha,
      borderRadius: 12 * scale,
      paddingVertical: 12 * scale,
      paddingHorizontal: 18 * scale,
      marginBottom: 24 * scale,
      maxWidth: 460 * scale,
    },
    errorIcon: {
      fontSize: 20 * scale,
      marginRight: 12 * scale,
    },
    errorText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 14 * scale,
      color: colors.ashubha,
      flex: 1,
      lineHeight: 20 * scale,
    },
  });
}
