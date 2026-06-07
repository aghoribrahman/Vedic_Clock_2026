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
import { stubState } from './helpers/stubState';

describe('BottomStrip', () => {
  it('renders both corner yantra rosettes (left + right)', () => {
    const { getAllByTestId } = render(<BottomStrip state={stubState()} />);
    expect(getAllByTestId('yantra-rosette')).toHaveLength(2);
  });

  it('shows the Vara in Devanagari (Guruvara stub → गुरुवार)', () => {
    const { getByText } = render(<BottomStrip state={stubState()} />);
    expect(getByText('गुरुवार')).toBeTruthy();
  });

  it('shows the Vara in Roman with its lord', () => {
    const { getByText } = render(<BottomStrip state={stubState()} />);
    expect(getByText('GURUVARA · Guru (Jupiter)')).toBeTruthy();
  });

  it('renders the Vikram Samvat year', () => {
    const { getByText } = render(<BottomStrip state={stubState()} />);
    expect(getByText('2083')).toBeTruthy();
    expect(getByText('SAMVAT')).toBeTruthy();
  });

  it('renders the location bookend', () => {
    const { getByText } = render(<BottomStrip state={stubState()} />);
    expect(getByText('भोपाल')).toBeTruthy();
    expect(getByText(/BHOPAL/)).toBeTruthy();
  });
});
