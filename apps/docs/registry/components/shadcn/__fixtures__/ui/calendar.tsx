/**
 * Stub fixture for @/components/ui/calendar.
 * Test-only — never shipped to consumers.
 *
 * Renders a single clickable button so DatePicker tests can:
 *   1. Find it by data-testid="calendar-day"
 *   2. Click it
 *   3. Assert onSelect was called with a Date (2026-01-02T00:00:00Z)
 */
import * as React from 'react';

export interface CalendarProps {
  mode?: string;
  selected?: Date;
  onSelect?: (date?: Date) => void;
}

export function Calendar({ onSelect }: CalendarProps) {
  return (
    <button
      type="button"
      data-testid="calendar-day"
      onClick={() => onSelect?.(new Date('2026-01-02T00:00:00Z'))}
    >
      day
    </button>
  );
}
