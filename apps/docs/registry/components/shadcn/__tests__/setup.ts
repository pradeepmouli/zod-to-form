/**
 * Vitest setup for shadcn adapter tests.
 * - Registers @testing-library/jest-dom matchers
 * - Cleans up RTL DOM between tests
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
