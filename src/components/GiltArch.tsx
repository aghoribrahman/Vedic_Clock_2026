/**
 * Decorative gilt arch — RN port of `lib/widgets/gilt_arch.dart`.
 *
 * Caps the top and bottom of the central dial column. Pure SVG path: a
 * shallow arc spanning the column's width with a gilt stroke, plus a
 * small bindu-dot at the apex.
 */

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  width: number;
  height: number;
  /** 'up' = apex points up (top cap), 'down' = apex points down (bottom). */
  direction?: 'up' | 'down';
}

export function GiltArch({ width, height, direction = 'up' }: Props): JSX.Element {
  // A simple quadratic-curve arch. Apex at midpoint, baseline at edges.
  const apexY = direction === 'up' ? 0 : height;
  const baseY = direction === 'up' ? height : 0;
  const d = `M 0 ${baseY} Q ${width / 2} ${apexY} ${width} ${baseY}`;
  const apexCircleY = direction === 'up' ? height * 0.18 : height * 0.82;
  return (
    <Svg width={width} height={height}>
      <Path
        d={d}
        fill="none"
        stroke={colors.giltLight}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d={d}
        fill="none"
        stroke={colors.giltDeep}
        strokeWidth={0.7}
        strokeLinecap="round"
        opacity={0.5}
        transform={`translate(0, ${direction === 'up' ? 4 : -4})`}
      />
      {/* Apex bindu dot. */}
      <Circle cx={width / 2} cy={apexCircleY} r={2.5} fill={colors.bindu} />
    </Svg>
  );
}
