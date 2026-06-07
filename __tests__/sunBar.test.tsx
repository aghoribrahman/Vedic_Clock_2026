/**
 * SunBar widget mount tests — verifies the daily sunrise/sunset/
 * daylight-duration strip is rendered (agenda item #1).
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import { SunBar } from '../src/components/SunBar';
import { stubState } from './helpers/stubState';

describe('SunBar', () => {
  it('mounts and exposes the sun-bar testID', () => {
    const { getByTestId } = render(<SunBar state={stubState()} />);
    expect(getByTestId('sun-bar')).toBeTruthy();
  });

  it('shows sunrise IST (the stub uses 05:39:43 IST)', () => {
    const { getByText } = render(<SunBar state={stubState()} />);
    expect(getByText('05:39:43')).toBeTruthy();
  });

  it('shows sunset IST (the stub uses 18:53:54 IST)', () => {
    const { getByText } = render(<SunBar state={stubState()} />);
    expect(getByText('18:53:54')).toBeTruthy();
  });

  it('shows daylight duration (~13h 14m for the stub)', () => {
    const { getByText } = render(<SunBar state={stubState()} />);
    expect(getByText('13h 14m')).toBeTruthy();
  });

  it('shows Devanagari + caps labels', () => {
    const { getByText } = render(<SunBar state={stubState()} />);
    expect(getByText('सूर्योदय')).toBeTruthy();
    expect(getByText('सूर्यास्त')).toBeTruthy();
    expect(getByText('दिनमान')).toBeTruthy();
    expect(getByText('SUNRISE · IST')).toBeTruthy();
    expect(getByText('SUNSET · IST')).toBeTruthy();
    expect(getByText('DAYLIGHT')).toBeTruthy();
  });
});
