import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import App from '../App';
import * as LocationHook from '../src/hooks/useLocation';

jest.mock('../src/hooks/useLocation');
jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
}));
jest.mock('expo-asset', () => ({
  useAssets: () => [[{}], null],
}));

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(LocationHook, 'useLocation').mockReturnValue({
      location: { cityHi: 'Test', latitude: 0, longitude: 0, heightMeters: 0, city: 'Test' },
      isLoading: false,
      saveLocation: jest.fn(),
      clearLocation: jest.fn(),
    });
  });

  it('mounts without crashing', () => {
    const tree = render(<App />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('anchors exactly 4 corner yantra rosettes (2 top + 2 bottom)', async () => {
    const { getAllByTestId } = render(<App />);
    // The hook seeds state synchronously inside its useEffect; wait for
    // the next microtask so the bars render.
    await waitFor(() => {
      expect(getAllByTestId('yantra-rosette').length).toBe(4);
    }, { timeout: 5000 });
  });
});
