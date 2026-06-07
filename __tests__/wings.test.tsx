/**
 * Wing-card widget mount tests — RN port of the Flutter Phase 8a wing
 * card invariants. Left wing carries the moon-driven readings (tithi /
 * nakshatra / moon-rashi); right wing carries the sun-driven readings
 * (sun-rashi / yoga / karana) plus the lunar-month gloss.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { LeftWing, RightWing } from '../src/components/Wings';
import { stubState } from './helpers/stubState';

describe('LeftWing', () => {
  it('renders the tithi hero card', () => {
    const { getByText } = render(<LeftWing state={stubState()} />);
    expect(getByText('TITHI')).toBeTruthy();
    expect(getByText('तिथि')).toBeTruthy();
    expect(getByText('त्रयोदशी · Trayodashi')).toBeTruthy();
  });

  it('renders the paksha + tithi number in the secondary line', () => {
    const { getByText } = render(<LeftWing state={stubState()} />);
    expect(getByText(/कृष्ण Krishna · 13\/15/)).toBeTruthy();
  });

  it('renders the nakshatra card', () => {
    const { getByText } = render(<LeftWing state={stubState()} />);
    expect(getByText('NAKSHATRA')).toBeTruthy();
    expect(getByText('रेवती · Revati')).toBeTruthy();
    expect(getByText('Pada 4 · Lord Mercury')).toBeTruthy();
  });

  it('renders the moon rashi card', () => {
    const { getByText } = render(<LeftWing state={stubState()} />);
    expect(getByText('MOON RASHI')).toBeTruthy();
    expect(getByText('चन्द्र राशि')).toBeTruthy();
    expect(getByText('मीन · Meena')).toBeTruthy();
  });
});

describe('RightWing', () => {
  it('renders the sun rashi hero card', () => {
    const { getByText } = render(<RightWing state={stubState()} />);
    expect(getByText('SUN RASHI')).toBeTruthy();
    expect(getByText('सूर्य राशि')).toBeTruthy();
    expect(getByText('मेष · Mesha')).toBeTruthy();
  });

  it('renders the lunar-month tertiary line on the sun card', () => {
    const { getByText } = render(<RightWing state={stubState()} />);
    expect(getByText(/Lunar month: वैशाख \(Vaisakha\)/)).toBeTruthy();
  });

  it('renders the yoga card', () => {
    const { getByText } = render(<RightWing state={stubState()} />);
    expect(getByText('YOGA')).toBeTruthy();
    expect(getByText('योग')).toBeTruthy();
    expect(getByText('साध्य · Sadhya')).toBeTruthy();
  });

  it('renders the karana card with sthira/chara label', () => {
    const { getByText } = render(<RightWing state={stubState()} />);
    expect(getByText('KARANA')).toBeTruthy();
    expect(getByText('विष्टि · Vishti')).toBeTruthy();
    expect(getByText(/Chara \(movable\) · slot 55/)).toBeTruthy();
  });
});
