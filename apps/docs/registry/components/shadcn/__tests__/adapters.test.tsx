/**
 * TDD tests for shadcn adapter components.
 * Task 2: Input + Textarea (pass-through)
 * Task 3: Checkbox + Switch (controlled boolean bridge)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../input.js';
import { Textarea } from '../textarea.js';
import { Checkbox } from '../checkbox.js';
import { Switch } from '../switch.js';

// ---------------------------------------------------------------------------
// Task 2 — Input adapter
// ---------------------------------------------------------------------------
describe('Input adapter', () => {
  it('renders a textbox', () => {
    render(<Input id="name" defaultValue="hello" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwards id prop', () => {
    render(<Input id="my-input" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'my-input');
  });

  it('forwards value via defaultValue', () => {
    render(<Input defaultValue="prefilled" />);
    expect(screen.getByRole('textbox')).toHaveValue('prefilled');
  });

  it('forwards ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has displayName "Input"', () => {
    expect(Input.displayName).toBe('Input');
  });
});

// ---------------------------------------------------------------------------
// Task 2 — Textarea adapter
// ---------------------------------------------------------------------------
describe('Textarea adapter', () => {
  it('renders a textarea', () => {
    render(<Textarea id="bio" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('forwards id prop', () => {
    render(<Textarea id="bio-field" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'bio-field');
  });

  it('forwards defaultValue', () => {
    render(<Textarea defaultValue="some text" />);
    expect(screen.getByRole('textbox')).toHaveValue('some text');
  });

  it('forwards ref to the underlying textarea element', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('has displayName "Textarea"', () => {
    expect(Textarea.displayName).toBe('Textarea');
  });
});

// ---------------------------------------------------------------------------
// Task 3 — Checkbox adapter (controlled boolean bridge)
// ---------------------------------------------------------------------------
describe('Checkbox adapter', () => {
  it('renders a checkbox', () => {
    render(<Checkbox id="agree" value={false} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('reflects value=false as unchecked', () => {
    render(<Checkbox id="agree" value={false} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('reflects value=true as checked', () => {
    render(<Checkbox id="agree" value={true} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange with boolean true when clicked while unchecked', () => {
    const onChange = vi.fn();
    render(<Checkbox id="ok" value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with boolean false when clicked while checked', () => {
    const onChange = vi.fn();
    render(<Checkbox id="ok" value={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('forwards id prop to underlying element', () => {
    render(<Checkbox id="cb-id" value={false} onChange={vi.fn()} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'cb-id');
  });

  it('does not throw when onChange is omitted', () => {
    render(<Checkbox id="cb-noop" value={false} />);
    expect(() => fireEvent.click(screen.getByRole('checkbox'))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Task 3 — Switch adapter (controlled boolean bridge)
// ---------------------------------------------------------------------------
describe('Switch adapter', () => {
  it('renders a switch', () => {
    render(<Switch id="notifications" value={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('reflects value=false as unchecked', () => {
    render(<Switch id="notifications" value={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('reflects value=true as checked', () => {
    render(<Switch id="notifications" value={true} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('calls onChange with boolean true when clicked while unchecked', () => {
    const onChange = vi.fn();
    render(<Switch id="sw" value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with boolean false when clicked while checked', () => {
    const onChange = vi.fn();
    render(<Switch id="sw" value={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('forwards id prop to underlying element', () => {
    render(<Switch id="sw-id" value={false} onChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toHaveAttribute('id', 'sw-id');
  });

  it('does not throw when onChange is omitted', () => {
    render(<Switch id="sw-noop" value={false} />);
    expect(() => fireEvent.click(screen.getByRole('switch'))).not.toThrow();
  });
});
