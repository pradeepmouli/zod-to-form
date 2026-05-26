import { describe, it, expect } from 'vitest';
import { resolveControlMode } from '../src/resolve-control-mode.js';
import type { ComponentOverride } from '../src/config.js';

// ─── resolveControlMode ───────────────────────────────────────────────────────

describe('resolveControlMode', () => {
  it("returns 'controller' when componentOverride.controlled is true", () => {
    const mapping: { componentOverride?: ComponentOverride } = {
      componentOverride: { controlled: true }
    };
    expect(resolveControlMode(mapping)).toBe('controller');
  });

  it("returns 'register' when componentOverride.controlled is false", () => {
    const mapping: { componentOverride?: ComponentOverride } = {
      componentOverride: { controlled: false }
    };
    expect(resolveControlMode(mapping)).toBe('register');
  });

  it("returns 'register' when componentOverride is present but controlled is omitted", () => {
    const mapping: { componentOverride?: ComponentOverride } = {
      componentOverride: { props: { className: 'foo' } }
    };
    expect(resolveControlMode(mapping)).toBe('register');
  });

  it("returns 'register' when componentOverride is absent", () => {
    const mapping: { componentOverride?: ComponentOverride } = {};
    expect(resolveControlMode(mapping)).toBe('register');
  });

  it("returns 'register' when componentOverride is undefined", () => {
    const mapping: { componentOverride?: ComponentOverride } = {
      componentOverride: undefined
    };
    expect(resolveControlMode(mapping)).toBe('register');
  });
});
