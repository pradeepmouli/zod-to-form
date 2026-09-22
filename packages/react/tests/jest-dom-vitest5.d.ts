// @testing-library/jest-dom 7.0.1's own vitest augmentation declares a
// single-parameter `Assertion<T>`, but vitest 5 restructured the interface
// to `Assertion<R, T>` (two parameters). The type-only merge is a no-op
// under the mismatched arity, so jest-dom's matchers vanish from the
// `expect(...).` surface at the type level (matchers still work at runtime).
// Re-declares the same merge jest-dom does, with the corrected arity.
import 'vitest';
import { type TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<
    R extends void | Promise<void> = void,
    T = unknown
  > extends TestingLibraryMatchers<any, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
}
