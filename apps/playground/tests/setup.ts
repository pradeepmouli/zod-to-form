/**
 * Vitest setup shared by playground unit tests.
 * - Registers @testing-library/jest-dom matchers (toBeInTheDocument, …)
 * - Cleans up React Testing Library DOM between tests
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
