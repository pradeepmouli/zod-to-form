// SPDX-License-Identifier: MIT
// HTML default ArrayReorderHandle — a keyboard-operable button group.
// shadcn variant lives in ../shadcn/ArrayReorderHandle.tsx.

import { createElement } from 'react';

/**
 * Props for the per-row reorder handle component.
 *
 * @category Components
 */
export interface ArrayReorderHandleProps {
  /** Current index of the row this handle controls (zero-based). */
  index: number;
  /** Total number of form-driven rows (excludes ghost rows). */
  total: number;
  /** Disable both directions (e.g. fixed-length array constraint). */
  disabled?: boolean;
  /** Move this row to a new index. Wired to RHF `move()` by ArrayBlock. */
  onMove: (from: number, to: number) => void;
}

/**
 * Default HTML reorder handle — keyboard-operable ↑/↓ buttons.
 * Override via `componentMap.ArrayReorderHandle`.
 */
export function ArrayReorderHandle(props: ArrayReorderHandleProps) {
  const { index, total, disabled, onMove } = props;
  const rowLabel = `row ${index + 1}`;
  const upDisabled = !!disabled || index === 0;
  const downDisabled = !!disabled || index === total - 1;

  return createElement(
    'span',
    { role: 'group', 'aria-label': `Reorder ${rowLabel}` },
    createElement(
      'button',
      {
        type: 'button',
        'aria-label': `Move ${rowLabel} up`,
        disabled: upDisabled,
        onClick: () => onMove(index, index - 1)
      },
      '↑'
    ),
    createElement(
      'button',
      {
        type: 'button',
        'aria-label': `Move ${rowLabel} down`,
        disabled: downDisabled,
        onClick: () => onMove(index, index + 1)
      },
      '↓'
    )
  );
}
