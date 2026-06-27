/**
 * Jest setup — runs once before each test file.
 *
 * Mocks Expo modules that touch the native layer at import time so
 * widget mount tests can run under node without throwing.
 */

// expo-screen-orientation, expo-keep-awake, expo-splash-screen, etc. all
// touch native APIs on import. jest-expo provides default mocks for many
// of these; we register the explicit ones we know our App.tsx uses.
jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn().mockResolvedValue(undefined),
  unlockAsync: jest.fn().mockResolvedValue(undefined),
  OrientationLock: { LANDSCAPE: 'LANDSCAPE' },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(undefined),
  deactivateKeepAwake: jest.fn(),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

// Pretend Google fonts are always loaded — `useFonts` is a hook that
// reads file URIs from native; mocking it returns [true, null] so our
// App renders past its fontsLoaded guard.
jest.mock('@expo-google-fonts/inter', () => ({
  useFonts: () => [true, null],
  Inter_400Regular: 0,
  Inter_500Medium: 0,
  Inter_600SemiBold: 0,
  Inter_700Bold: 0,
}));
jest.mock('@expo-google-fonts/tiro-devanagari-hindi', () => ({
  useFonts: () => [true, null],
  TiroDevanagariHindi_400Regular: 0,
}));

jest.mock('expo-video', () => {
  return {
    useVideoPlayer: jest.fn((source, setup) => {
      const player = {
        loop: false,
        muted: false,
        staysActiveInBackground: false,
        play: jest.fn(),
        pause: jest.fn(),
        addListener: jest.fn(() => ({ remove: jest.fn() })),
      };
      if (setup) setup(player);
      return player;
    }),
    VideoView: 'VideoView',
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);


