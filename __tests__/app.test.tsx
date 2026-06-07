/**
 * App-level integration tests — full mount of the root component.
 *
 * Locks down the cross-component invariant that survived the rosette
 * refactor in the Flutter codebase: exactly **four** corner yantra
 * rosettes anchor the layout (2 in TopBar + 2 in BottomStrip).
 *
 * NOTE: `useVedicClock` ticks a real `setInterval`; we keep the mount
 * + assertions synchronous so the tests don't depend on the timer
 * firing.
 */

import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import App from '../App';

describe('App', () => {
  it('mounts without crashing', () => {
    const tree = render(<App />);
    expect(tree.toJSON()).toBeTruthy();
  });

  it('anchors exactly 4 corner yantra rosettes (2 top + 2 bottom)', async () => {
    const { getAllByTestId } = render(<App />);
    // The hook seeds state synchronously inside its useEffect; wait for
    // the next microtask so the bars render.
    await waitFor(() => {
      expect(getAllByTestId('yantra-rosette').length).toBe(4);
    }, { timeout: 5000 });
  });
});
