/**
 * Vitest setup shared by playground unit tests.
 * - Registers @testing-library/jest-dom matchers (toBeInTheDocument, …)
 * - Cleans up React Testing Library DOM between tests
 * - Polyfills window.localStorage: Node 22+'s experimental native Web Storage
 *   global shadows jsdom's own implementation unless --localstorage-file is
 *   passed, so tests see `localStorage === undefined` without this.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

class MemoryStorage implements Storage {
  #map = new Map<string, string>();
  get length() {
    return this.#map.size;
  }
  clear() {
    this.#map.clear();
  }
  getItem(key: string) {
    return this.#map.has(key) ? this.#map.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.#map.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.#map.delete(key);
  }
  setItem(key: string, value: string) {
    this.#map.set(key, String(value));
  }
}

const targets = typeof window === 'undefined' ? [globalThis] : [globalThis, window];
for (const target of targets) {
  Object.defineProperty(target, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(target, 'sessionStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  cleanup();
});
