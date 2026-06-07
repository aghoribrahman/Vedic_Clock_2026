import { useWindowDimensions, PixelRatio } from 'react-native';

export interface ResponsiveConfig {
  width: number;
  height: number;
  isPortrait: boolean;
  scale: number;
  topBarHeight: number;
  sunBarHeight: number;
  bottomStripHeight: number;
  spacing: number;
  scaleFont: (size: number) => number;
}

export function useResponsive(): ResponsiveConfig {
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;

  // Reference width for design scaling:
  // - Landscape target: 1024px
  // - Portrait target: 414px (typical mobile width)
  const scale = isPortrait
    ? Math.min(1.25, Math.max(0.75, width / 414))
    : Math.min(1.4, Math.max(0.7, width / 1024));

  // Scaled bar heights, bounded within sensible limits so they look sharp
  const topBarHeight = Math.max(52, Math.min(88, 64 * scale));
  const sunBarHeight = Math.max(38, Math.min(68, 48 * scale));
  const bottomStripHeight = Math.max(52, Math.min(88, 64 * scale));

  // Fluid spacing factor
  const spacing = Math.max(8, Math.min(24, 16 * scale));

  /**
   * Scales a font size dynamically by the screen scale factor, 
   * adjusted by the device's system-wide font accessibility scale.
   */
  const scaleFont = (size: number): number => {
    const fontScale = PixelRatio.getFontScale();
    return (size * scale) / fontScale;
  };

  return {
    width,
    height,
    isPortrait,
    scale,
    topBarHeight,
    sunBarHeight,
    bottomStripHeight,
    spacing,
    scaleFont,
  };
}
