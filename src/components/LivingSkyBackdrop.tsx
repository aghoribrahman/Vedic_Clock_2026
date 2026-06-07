import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { computeSolarPhase, gradientForPhase } from '../core/skyGradient';
import { VedicClockState } from '../models';

interface Props {
  state: VedicClockState;
}

const BACKGROUND_VIDEO = require('../../assets/bg0.mp4');

export function LivingSkyBackdrop({ state }: Props): JSX.Element {
  const { width, height } = useWindowDimensions();
  const appState = useRef(AppState.currentState);
  
  const player = useVideoPlayer(BACKGROUND_VIDEO, (player) => {
    player.loop = true;
    player.muted = true;
    player.staysActiveInBackground = true;
    player.play();
  });

  // 1. Robust Looping fallback
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      player.play();
    });
    return () => sub.remove();
  }, [player]);

  // 2. Playback Recovery (App Focus / Visibility)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        player.play();
      }
      appState.current = nextAppState;
    });

    // Web-specific visibility listener for tab switching
    if (Platform.OS === 'web') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          player.play();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        subscription.remove();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }

    return () => {
      subscription.remove();
    };
  }, [player]);

  // 3. User Interaction "Unlock" (Web Autoplay Policy)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const unlock = () => {
      player.play();
      // Remove listener after first interaction
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [player]);

  // Initial play trigger
  useEffect(() => {
    player.play();
  }, [player]);

  return (
    <View 
      style={[styles.container, { width, height }]} 
      pointerEvents="none" 
      testID="living-sky-backdrop"
    >
      <VideoView
        player={player}
        style={{ width, height, position: 'absolute' }}
        contentFit="fill"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}

      />
      


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D1B2A', // Theme bgDeep fallback
    zIndex: 0,
  },
  video: {
    width: '100%',
    height: '100%',
  },

});

export { computeSolarPhase, gradientForPhase };

