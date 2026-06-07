/**
 * YantraRosette widget mount tests — RN port of the Flutter widget tests
 * that exercise `lib/widgets/yantra_rosette.dart`.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { YantraRosette } from '../src/components/YantraRosette';

describe('YantraRosette', () => {
  it('mounts at the given size and exposes a testID', () => {
    const { getByTestId } = render(<YantraRosette size={64} />);
    const view = getByTestId('yantra-rosette');
    const style = flatten(view.props.style);
    expect(style.width).toBe(64);
    expect(style.height).toBe(64);
  });

  it('defaults to opacity 0.22 (watermark level)', () => {
    const { getByTestId } = render(<YantraRosette size={64} />);
    expect(flatten(getByTestId('yantra-rosette').props.style).opacity).toBeCloseTo(0.22, 2);
  });

  it('respects an explicit opacity override', () => {
    const { getByTestId } = render(<YantraRosette size={64} opacity={0.6} />);
    expect(flatten(getByTestId('yantra-rosette').props.style).opacity).toBeCloseTo(0.6, 2);
  });

  it('renders at varying sizes without crashing', () => {
    for (const size of [32, 48, 64, 96, 128]) {
      const { getByTestId, unmount } = render(<YantraRosette size={size} />);
      expect(flatten(getByTestId('yantra-rosette').props.style).width).toBe(size);
      unmount();
    }
  });
});

function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten));
  return (style ?? {}) as Record<string, unknown>;
}
