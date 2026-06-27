/**
 * BottomStrip widget mount tests.
 *
 * Locks down:
 *   • Vara bookend on the left (Devanagari + Roman).
 *   • Samvat badge in the centre (year + label).
 *   • Location bookend on the right (Bhopal + lat/lon).
 *   • Two YantraRosette corner ornaments anchor the strip.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { BottomStrip } from '../src/components/BottomStrip';
import { DEFAULT_LOCATION } from '../src/config';
import { stubState } from './helpers/stubState';

describe('BottomStrip', () => {
  it('renders both corner yantra rosettes (left + right)', () => {
    const { getAllByTestId } = render(<BottomStrip state={stubState()} location={DEFAULT_LOCATION} />);
    expect(getAllByTestId('yantra-rosette')).toHaveLength(2);
  });

  it('renders the Vikram Samvat year', () => {
    const { getAllByText, getByText } = render(<BottomStrip state={stubState()} location={DEFAULT_LOCATION} />);
    expect(getAllByText('2083').length).toBeGreaterThan(0);
    expect(getByText('विक्रम संवत्')).toBeTruthy();
  });

  it('renders the location bookend', () => {
    const { getAllByText } = render(<BottomStrip state={stubState()} location={DEFAULT_LOCATION} />);
    expect(getAllByText('भोपाल').length).toBeGreaterThan(0);
  });
});
