/**
 * HeroDigits widget mount tests — direct mirror of the Flutter Phase 8a
 * `_HeroDigits` invariants (big flag bumps font size, adds stronger
 * gilt halo).
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { HeroDigits } from '../src/components/HeroDigits';

describe('HeroDigits', () => {
  it('renders the supplied text', () => {
    const { getByText } = render(<HeroDigits text="07" />);
    expect(getByText('07')).toBeTruthy();
  });

  it('normal variant uses fontSize 64', () => {
    const { getByText } = render(<HeroDigits text="12" />);
    const style = flatten(getByText('12').props.style);
    expect(style.fontSize).toBe(64);
  });

  it('big variant uses fontSize 80 (hero hierarchy)', () => {
    const { getByText } = render(<HeroDigits text="29" big />);
    const style = flatten(getByText('29').props.style);
    expect(style.fontSize).toBe(80);
  });

  it('both variants use tabular figures so digits don\'t jitter', () => {
    const a = render(<HeroDigits text="00" />);
    const b = render(<HeroDigits text="00" big />);
    expect(flatten(a.getByText('00').props.style).fontVariant).toContain('tabular-nums');
    expect(flatten(b.getByText('00').props.style).fontVariant).toContain('tabular-nums');
  });

  it('big variant has a stronger text shadow than normal', () => {
    const a = render(<HeroDigits text="29" />);
    const b = render(<HeroDigits text="29" big />);
    const aRad = Number(flatten(a.getByText('29').props.style).textShadowRadius);
    const bRad = Number(flatten(b.getByText('29').props.style).textShadowRadius);
    expect(bRad).toBeGreaterThan(aRad);
  });
});

// Flatten a StyleSheet style prop (which may be an object or array).
function flatten(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.map(flatten));
  }
  return (style ?? {}) as Record<string, unknown>;
}
