import React from 'react';
import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { LocationPromptScreen } from '../LocationPromptScreen';
import * as ResponsiveHook from '../../hooks/useResponsive';

// Mock the useResponsive hook so we can simulate different screen sizes
jest.mock('../../hooks/useResponsive');

describe('LocationPromptScreen Responsiveness', () => {
  it('scales asset sizes and layout paddings for mobile (scale 0.75)', () => {
    // Simulate a small mobile screen with a scale of 0.75
    jest.spyOn(ResponsiveHook, 'useResponsive').mockReturnValue({
      scale: 0.75,
      tier: 'mobile',
      width: 414,
      height: 896,
      isPortrait: true,
      topBarHeight: 50,
      sunBarHeight: 40,
      bottomStripHeight: 50,
      spacing: 10,
      scaleFont: (size) => size * 0.75,
    });

    const { getByText, getByTestId } = render(
      <LocationPromptScreen onLocationSelected={jest.fn()} />
    );

    // Verify the title font size scaled down to 24 (32 * 0.75)
    const title = getByText('विक्रमादित्य वैदिक घड़ी');
    const titleStyle = StyleSheet.flatten(title.props.style);
    expect(titleStyle.fontSize).toBe(24);

    // Verify the container padding scaled down to 24 (32 * 0.75)
    const container = title.parent.parent;
    const containerStyle = StyleSheet.flatten(container.props.style);
    expect(containerStyle.paddingHorizontal).toBe(24);
  });

  it('scales asset sizes and layout paddings up for TV (scale 2.0)', () => {
    // Simulate a large TV screen with a scale of 2.0
    jest.spyOn(ResponsiveHook, 'useResponsive').mockReturnValue({
      scale: 2.0,
      tier: 'tv',
      width: 1920,
      height: 1080,
      isPortrait: false,
      topBarHeight: 120,
      sunBarHeight: 100,
      bottomStripHeight: 120,
      spacing: 30,
      scaleFont: (size) => size * 2.0,
    });

    const { getByText, getByTestId } = render(
      <LocationPromptScreen onLocationSelected={jest.fn()} />
    );

    // Verify the title font size scaled up to 64 (32 * 2.0)
    const title = getByText('विक्रमादित्य वैदिक घड़ी');
    const titleStyle = StyleSheet.flatten(title.props.style);
    expect(titleStyle.fontSize).toBe(64);

    // Verify the GPS button padding and border scaled up
    const gpsButton = getByTestId('gps-button');
    const flatStyle = StyleSheet.flatten(gpsButton.props.style);
    
    expect(flatStyle.paddingVertical).toBe(32); // 16 * 2.0
    expect(flatStyle.paddingHorizontal).toBe(64); // 32 * 2.0
    expect(flatStyle.borderWidth).toBe(3); // 1.5 * 2.0
  });
});
