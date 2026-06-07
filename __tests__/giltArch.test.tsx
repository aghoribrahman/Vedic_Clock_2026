/**
 * GiltArch widget mount tests — RN port of the Flutter widget tests
 * that exercise `lib/widgets/gilt_arch.dart`.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { GiltArch } from '../src/components/GiltArch';

describe('GiltArch', () => {
  it('renders without crashing with default direction (up)', () => {
    const tree = render(<GiltArch width={120} height={28} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders the down-direction variant', () => {
    const tree = render(<GiltArch width={120} height={28} direction="down" />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders consistently across many widths', () => {
    for (const w of [80, 120, 200, 320, 480]) {
      const tree = render(<GiltArch width={w} height={28} />);
      expect(tree.toJSON()).toBeTruthy();
      tree.unmount();
    }
  });
});
