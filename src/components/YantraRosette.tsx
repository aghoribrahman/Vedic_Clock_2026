/**
 * Eight-petaled yantra rosette — RN port of `lib/widgets/yantra_rosette.dart`.
 *
 * Used as a corner ornament. Rendered at low opacity (the parent wraps it
 * in an `Opacity` View so it reads as a watermark, not a competitor to
 * the chrome-bar text on top of it).
 *
 * Geometry:
 *   • An outer ring (giltDeep stroke)
 *   • 8 lotus petals around the centre
 *   • A central bindu dot
 *
 * All in SVG so it scales cleanly on any DPI.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  size: number;
  /** Master opacity multiplier — defaults to 0.22 to read as watermark. */
  opacity?: number;
  /** Optional stroke color — defaults to giltDeep / giltLight. */
  color?: string;
}

export function YantraRosette({ size, opacity = 0.22, color }: Props): JSX.Element {
  const half = size / 2;
  const outerR = half * 0.92;
  const petalLen = half * 0.65;
  const petalWid = half * 0.22;

  const strokeColor = color || colors.giltDeep;
  const petalStroke = color || colors.giltLight;

  // Build the 8 petal paths.
  const petals: string[] = [];
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4; // every 45°
    const cx = half + Math.cos(ang) * petalLen * 0.45;
    const cy = half + Math.sin(ang) * petalLen * 0.45;
    const tipX = half + Math.cos(ang) * petalLen;
    const tipY = half + Math.sin(ang) * petalLen;
    const baseX = half - Math.cos(ang) * petalLen * 0.05;
    const baseY = half - Math.sin(ang) * petalLen * 0.05;
    const perpX = Math.cos(ang + Math.PI / 2);
    const perpY = Math.sin(ang + Math.PI / 2);
    const c1x = cx + perpX * petalWid;
    const c1y = cy + perpY * petalWid;
    const c2x = cx - perpX * petalWid;
    const c2y = cy - perpY * petalWid;
    petals.push(
      `M ${baseX} ${baseY} Q ${c1x} ${c1y} ${tipX} ${tipY} Q ${c2x} ${c2y} ${baseX} ${baseY} Z`,
    );
  }

  // Opacity lives on a wrapping View (rather than the Svg directly) so
  // it's queryable from the host-component layer in widget tests —
  // react-native-svg consumes some attribute props before they reach the
  // test fiber. Visually identical either way.
  return (
    <View style={{ opacity, width: size, height: size }} testID="yantra-rosette">
      <Svg width={size} height={size}>
        {/* Outer ring */}
      <Circle
        cx={half}
        cy={half}
        r={outerR}
        stroke={strokeColor}
        strokeWidth={1.4}
        fill="none"
      />
      <Circle
        cx={half}
        cy={half}
        r={outerR * 0.7}
        stroke={strokeColor}
        strokeWidth={0.8}
        fill="none"
      />
      {/* Petals */}
      {petals.map((d, i) => (
        <Path
          key={i}
          d={d}
          fill="none"
          stroke={petalStroke}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* Bindu — the warm core */}
      <Circle cx={half} cy={half} r={half * 0.05} fill={colors.bindu} />
      </Svg>
    </View>
  );
}
