/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DegradedNotice } from '../../src/components/layout/DegradedNotice.tsx';

describe('DegradedNotice', () => {
  it('renders nothing when there are no errors', () => {
    const { container } = render(<DegradedNotice errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders an accessible status region with the first error', () => {
    render(<DegradedNotice errors={['upstream unavailable']} />);

    const region = screen.getByRole('status');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent(/shadcn components degraded/i);
    expect(region).toHaveTextContent('upstream unavailable');
  });

  it('shows the first error + a "+N more" hint when extras exist', () => {
    render(<DegradedNotice errors={['first err', 'second err', 'third err']} />);

    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('first err');
    expect(region).toHaveTextContent('+2 more');
  });
});
