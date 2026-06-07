/**
 * TopBar widget mount tests — mirror of the Flutter
 * `test/layout_symmetry_test.dart` assertions for the top bar.
 *
 * Locks down:
 *   • IST time (h:mm a + HH:mm:ss IST) is rendered.
 *   • Devanagari Gregorian date is rendered.
 *   • Two YantraRosette corner ornaments anchor the bar.
 *   • Brand tagline shows on normal days.
 *   • Festival chip overrides the tagline on festival days.
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { TopBar } from '../src/components/TopBar';
import { stubState, stubStateWithFestival } from './helpers/stubState';

describe('TopBar', () => {
  it('renders both corner yantra rosettes (left + right)', () => {
    const { getAllByTestId } = render(<TopBar state={stubState()} />);
    expect(getAllByTestId('yantra-rosette')).toHaveLength(2);
  });

  it('shows the brand title image on normal (non-festival) days', () => {
    const { getByTestId } = render(<TopBar state={stubState()} />);
    expect(getByTestId('title-image')).toBeTruthy();
  });

  it('shows the festival chip on festival days', () => {
    const { getByText, queryByText } = render(<TopBar state={stubStateWithFestival()} />);
    expect(getByText(/दीपावली/)).toBeTruthy();
    // The plain tagline should NOT be present when a festival is shown.
    expect(queryByText(/विक्रमादित्य वैदिक घड़ी/)).toBeNull();
  });

  it('renders the IST time in 12-hour format', () => {
    // stub state's IST wall clock is 12:00 IST.
    const { getByText } = render(<TopBar state={stubState()} />);
    expect(getByText('12:00 PM')).toBeTruthy();
  });

  it('renders the IST time in 24-hour format with seconds', () => {
    const { getByText } = render(<TopBar state={stubState()} />);
    expect(getByText('12:00:00 IST')).toBeTruthy();
  });

  it('renders the date in Devanagari', () => {
    const { getByText } = render(<TopBar state={stubState()} />);
    expect(getByText('14 मई 2026')).toBeTruthy();
  });

  it('renders the weekday gloss in caps (THU for the stub)', () => {
    const { getByText } = render(<TopBar state={stubState()} />);
    expect(getByText('THU')).toBeTruthy();
  });
});
