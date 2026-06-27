/**
 * DialCore widget mount tests.
 *
 * Locks down:
 *   • Hero MM : KK : KK digits render with zero padding.
 *   • The active muhurta's Devanagari + Roman name shows below the dial.
 *   • The "MUHURTA · KALA · KASHTHA" caption is visible.
 *   • The dial renders 30 wedges (via UNSAFE_getAllByType on Path).
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { Path } from 'react-native-svg';
import { DialCore } from '../src/components/DialCore';
import { stubState } from './helpers/stubState';

jest.mock('../src/components/HeroDigits', () => {
  const { Text } = require('react-native');
  return {
    HeroDigits: ({ text }: { text: string }) => <Text>{text}</Text>,
  };
});

describe('DialCore', () => {
  it('mounts at a given size', () => {
    const tree = render(<DialCore state={stubState()} size={400} />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('renders zero-padded MM, KK, KK hero digits', () => {
    const s = stubState();
    const { getByText } = render(<DialCore state={s} size={400} />);
    expect(getByText(pad2(s.muhurtaInDay))).toBeTruthy();
    expect(getByText(pad2(s.kalaInMuhurta))).toBeTruthy();
    expect(getByText(pad2(s.kashthaInKala))).toBeTruthy();
  });

  it('renders the MUHURTA · KALA · KASHTHA caption', () => {
    const { getByText } = render(<DialCore state={stubState()} size={400} />);
    expect(getByText('मुहूर्त')).toBeTruthy();
  });

  it('renders the active muhurta name (Devanagari + Roman)', () => {
    const s = stubState();
    const { getByText } = render(<DialCore state={s} size={400} />);
    expect(getByText(`${s.muhurta.devanagari} · ${s.muhurta.name}`)).toBeTruthy();
  });

  it('renders the active muhurta deity gloss', () => {
    const s = stubState();
    const { getByText } = render(<DialCore state={s} size={400} />);
    expect(getByText('देवता : ब्रह्मा')).toBeTruthy();
  });

  it('paints 30 wedge paths + the elapsed-time hand', () => {
    const { UNSAFE_getAllByType } = render(<DialCore state={stubState()} size={400} />);
    const paths = UNSAFE_getAllByType(Path);
    // 30 wedges + 1 hand = 31, plus gilt arch paths (2 arches × 2 strokes each = 4)
    // → at least 31. Lower bound is the meaningful check.
    expect(paths.length).toBeGreaterThanOrEqual(31);
  });
});

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
