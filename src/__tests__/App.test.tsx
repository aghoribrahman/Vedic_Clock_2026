import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';
import * as ResponsiveHook from '../hooks/useResponsive';
import * as LocationHook from '../hooks/useLocation';
import * as ClockHook from '../hooks/useVedicClock';

jest.mock('../hooks/useResponsive');
jest.mock('../hooks/useLocation');
jest.mock('../hooks/useVedicClock');
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));
jest.mock('expo-asset', () => ({
  useAssets: () => [[{}], null],
}));
jest.mock('expo-av', () => ({
  Video: 'Video',
}));
jest.mock('expo-screen-orientation', () => ({
  unlockAsync: jest.fn().mockResolvedValue(true),
}));
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn().mockResolvedValue(true),
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(true),
  hideAsync: jest.fn().mockResolvedValue(true),
}));

describe('App Orientation Responsiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(LocationHook, 'useLocation').mockReturnValue({
      location: { cityHi: 'Test', latitude: 0, longitude: 0, heightMeters: 0, city: 'Test' },
      isLoading: false,
      saveLocation: jest.fn(),
      clearLocation: jest.fn(),
    });

    jest.spyOn(ClockHook, 'useVedicClock').mockReturnValue({
      nowUtc: new Date(),
      panchang: {
        vara: { nameHi: 'Test' },
      },
    } as any);
  });

  it('renders correctly in Portrait orientation', () => {
    jest.spyOn(ResponsiveHook, 'useResponsive').mockReturnValue({
      scale: 1.0,
      tier: 'mobile',
      width: 414,
      height: 896,
      isPortrait: true,
      topBarHeight: 64,
      sunBarHeight: 48,
      bottomStripHeight: 64,
      spacing: 16,
      scaleFont: (size) => size,
    });

    const { toJSON } = render(<App />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders correctly in Landscape orientation', () => {
    jest.spyOn(ResponsiveHook, 'useResponsive').mockReturnValue({
      scale: 1.0,
      tier: 'tablet',
      width: 1024,
      height: 768,
      isPortrait: false,
      topBarHeight: 64,
      sunBarHeight: 48,
      bottomStripHeight: 64,
      spacing: 16,
      scaleFont: (size) => size,
    });

    const { toJSON } = render(<App />);
    expect(toJSON()).toMatchSnapshot();
  });
});
