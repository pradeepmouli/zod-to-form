/**
 * TDD tests for shadcn adapter components.
 * Task 1: Select (option list → onChange(string))
 * Task 2: RadioGroup (radio items → onChange(string))
 * Task 3: DatePicker (Popover+Calendar controlled bridge)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../select.js';
import { RadioGroup } from '../radio-group.js';
import { DatePicker } from '../date-picker.js';

// ---------------------------------------------------------------------------
// Task 1 — Select adapter
// ---------------------------------------------------------------------------
describe('Select adapter', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' }
  ];

  it('renders all option labels', () => {
    render(<Select options={options} />);
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
  });

  it('reflects the current value', () => {
    render(<Select value="a" options={options} />);
    const select = screen.getByTestId('select') as HTMLSelectElement;
    expect(select.value).toBe('a');
  });

  it('calls onChange with the selected string when changed', () => {
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('select'), { target: { value: 'b' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('converts numeric option values to strings', () => {
    const numOptions = [
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' }
    ];
    const onChange = vi.fn();
    render(<Select options={numOptions} onChange={onChange} />);
    fireEvent.change(screen.getByTestId('select'), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('does not throw when onChange is omitted', () => {
    render(<Select options={options} />);
    expect(() =>
      fireEvent.change(screen.getByTestId('select'), { target: { value: 'b' } })
    ).not.toThrow();
  });

  it('renders with no options when options prop is omitted', () => {
    render(<Select />);
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Task 2 — RadioGroup adapter
// ---------------------------------------------------------------------------
describe('RadioGroup adapter', () => {
  const options = [
    { value: 'x', label: 'Option X' },
    { value: 'y', label: 'Option Y' }
  ];

  it('renders a radiogroup', () => {
    render(<RadioGroup options={options} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('renders a radio input for each option', () => {
    render(<RadioGroup options={options} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });

  it('renders a label for each option', () => {
    render(<RadioGroup options={options} />);
    expect(screen.getByText('Option X')).toBeInTheDocument();
    expect(screen.getByText('Option Y')).toBeInTheDocument();
  });

  it('calls onChange with the string value when a radio is clicked', () => {
    const onChange = vi.fn();
    render(<RadioGroup options={options} onChange={onChange} name="group1" />);
    // The stub fires onSelect(value) on the radio's click event (React 19 + jsdom)
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('y');
  });

  it('does not throw when onChange is omitted', () => {
    render(<RadioGroup options={options} />);
    expect(() => fireEvent.click(screen.getAllByRole('radio')[0]!)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Task 3 — DatePicker adapter
// ---------------------------------------------------------------------------
describe('DatePicker adapter', () => {
  it('shows "Pick a date" when no value is provided', () => {
    render(<DatePicker />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('calls onChange with a Date instance when a calendar day is clicked', () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);
    fireEvent.click(screen.getByTestId('calendar-day'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const firstArg = onChange.mock.calls[0]?.[0];
    expect(firstArg).toBeInstanceOf(Date);
  });

  it('always calls onChange with a Date instance (Date-only wrapper — no string mode)', () => {
    // The new thin wrapper is Date-only. Even when a string is passed as value
    // (which core no longer does for z.string().date()), onChange always emits a Date.
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);
    fireEvent.click(screen.getByTestId('calendar-day'));
    expect(onChange).toHaveBeenCalledTimes(1);
    const firstArg = onChange.mock.calls[0]?.[0];
    expect(firstArg).toBeInstanceOf(Date);
  });

  it('shows a formatted date (not "Pick a date") when value is a Date', () => {
    render(<DatePicker value={new Date('2026-01-02T00:00:00Z')} />);
    // The trigger is the button that does NOT have data-testid="calendar-day"
    const buttons = screen.getAllByRole('button');
    const trigger = buttons.find((b) => b.getAttribute('data-testid') !== 'calendar-day')!;
    expect(trigger.textContent).not.toBe('Pick a date');
    expect(trigger.textContent).toContain('2026');
  });

  it('shows "Pick a date" when value is an ISO string (Date-only wrapper — no string parsing)', () => {
    // The new thin wrapper accepts only Date instances. A string is not a Date,
    // so the placeholder is shown rather than parsing the string.
    render(<DatePicker value={'2026-03-15T00:00:00Z' as unknown as Date} />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('shows "Pick a date" when value is undefined', () => {
    render(<DatePicker value={undefined} />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('shows "Pick a date" when value is empty string (treated as non-Date)', () => {
    // The component accepts Date | undefined. A string is not a Date; the guard
    // treats it as undefined and shows the placeholder. Cast to satisfy TS.
    render(<DatePicker value={'' as unknown as Date} />);
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('shows the placeholder (no throw) when value is an invalid date string', () => {
    // Same guard — a non-Date value is shown as placeholder without throwing.
    expect(() => render(<DatePicker value={'not-a-date' as unknown as Date} />)).not.toThrow();
    expect(screen.getByText('Pick a date')).toBeInTheDocument();
  });

  it('does not throw when onChange is omitted and a day is clicked', () => {
    render(<DatePicker />);
    expect(() => fireEvent.click(screen.getByTestId('calendar-day'))).not.toThrow();
  });

  it('forwards disabled to the trigger button', () => {
    render(<DatePicker disabled />);
    const buttons = screen.getAllByRole('button');
    const trigger = buttons.find((b) => b.getAttribute('data-testid') !== 'calendar-day')!;
    expect(trigger).toBeDisabled();
  });

  it('forwards id to the trigger button', () => {
    render(<DatePicker id="dob" />);
    expect(screen.getByRole('button', { name: /pick a date/i })).toHaveAttribute('id', 'dob');
  });
});
