import { describe, it, expect } from 'vitest';
import { detectContext } from '../../src/lib/config-completions.ts';

describe('detectContext', () => {
  it('returns null outside braces', () => {
    expect(detectContext('import { defineConfig }')).toBeNull();
    expect(detectContext('')).toBeNull();
  });

  it('returns top-level inside first brace level', () => {
    expect(detectContext('defineConfig({')).toBe('top-level');
    expect(detectContext('defineConfig({ ')).toBe('top-level');
    expect(detectContext('defineConfig({ com')).toBe('top-level');
  });

  it('returns components inside components block', () => {
    expect(detectContext('defineConfig({ components: {')).toBe('components');
    expect(detectContext('defineConfig({ components: { sou')).toBe('components');
  });

  it('returns components.preset after preset colon', () => {
    expect(detectContext('defineConfig({ components: { preset: ')).toBe('components.preset');
    expect(detectContext("defineConfig({ components: { preset: '")).toBe('components.preset');
  });

  it('returns defaults inside defaults block', () => {
    expect(detectContext('defineConfig({ defaults: {')).toBe('defaults');
    expect(detectContext('defineConfig({ defaults: { mo')).toBe('defaults');
  });

  it('returns defaults.mode after mode colon', () => {
    expect(detectContext('defineConfig({ defaults: { mode: ')).toBe('defaults.mode');
  });

  it('returns defaults.ui after ui colon', () => {
    expect(detectContext('defineConfig({ defaults: { ui: ')).toBe('defaults.ui');
  });

  it('returns fields inside fields block', () => {
    expect(detectContext('defineConfig({ fields: {')).toBe('fields');
  });

  it('returns field-config inside a field entry', () => {
    expect(detectContext("defineConfig({ fields: { 'name': {")).toBe('field-config');
    expect(detectContext("defineConfig({ fields: { 'name': { lab")).toBe('field-config');
  });

  it('returns field-config.component after component colon', () => {
    expect(detectContext("defineConfig({ fields: { 'name': { component: ")).toBe(
      'field-config.component'
    );
  });

  it('returns overrides inside overrides block (depth 3 under components)', () => {
    expect(detectContext('defineConfig({ components: { overrides: {')).toBe('overrides');
  });

  it('returns override-config inside an override entry (depth 4)', () => {
    expect(detectContext('defineConfig({ components: { overrides: { Select: {')).toBe(
      'override-config'
    );
  });

  it('returns top-level after closing a nested block', () => {
    expect(detectContext('defineConfig({ components: { source: "./ui" }, ')).toBe('top-level');
  });

  it('resets lastKey after comma', () => {
    expect(detectContext("defineConfig({ defaults: { mode: 'submit', ")).toBe('defaults');
  });
});
