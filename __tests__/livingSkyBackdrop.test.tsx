/**
 * LivingSkyBackdrop widget mount tests — RN port of the Flutter
 * widget tests in `test/living_sky_test.dart` for the widget itself
 * (the math half is covered by `skyGradient.test.ts`).
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { LivingSkyBackdrop } from '../src/components/LivingSkyBackdrop';
import { stubState, stubStateNight, stubStatePreDawn } from './helpers/stubState';

describe('LivingSkyBackdrop', () => {
  it('mounts and paints a single frame without crashing', () => {
    const { getByTestId } = render(<LivingSkyBackdrop state={stubState()} />);
    expect(getByTestId('living-sky-backdrop')).toBeTruthy();
  });

  it('survives a state update (clock tick)', () => {
    const { getByTestId, rerender } = render(<LivingSkyBackdrop state={stubState()} />);
    rerender(<LivingSkyBackdrop state={stubStateNight()} />);
    expect(getByTestId('living-sky-backdrop')).toBeTruthy();
  });

  it('renders in pre-dawn state', () => {
    const { getByTestId } = render(<LivingSkyBackdrop state={stubStatePreDawn()} />);
    expect(getByTestId('living-sky-backdrop')).toBeTruthy();
  });

  it('renders in deep-night state', () => {
    const { getByTestId } = render(<LivingSkyBackdrop state={stubStateNight()} />);
    expect(getByTestId('living-sky-backdrop')).toBeTruthy();
  });
});
