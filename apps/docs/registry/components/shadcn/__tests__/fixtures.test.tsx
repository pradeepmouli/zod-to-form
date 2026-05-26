/**
 * Smoke test: verifies that the @/components/ui/* alias resolves to the
 * stub fixtures, jsdom is configured, and @testing-library/react works.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '@/components/ui/checkbox';

describe('fixture alias smoke test', () => {
  it('renders Checkbox stub and fires onCheckedChange when clicked', () => {
    const handler = vi.fn();
    render(<Checkbox id="test-cb" checked={false} onCheckedChange={handler} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('renders Checkbox as checked when checked=true', () => {
    render(<Checkbox id="test-cb2" checked={true} onCheckedChange={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });
});
