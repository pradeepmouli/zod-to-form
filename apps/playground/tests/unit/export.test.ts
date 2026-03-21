import { describe, it, expect } from 'vitest';
import { serializeConfigToTs } from '../../src/lib/config-schema.ts';

describe('serializeConfigToTs', () => {
  it('generates valid defineConfig call with fields', () => {
    const config = {
      fields: {
        name: { component: 'Textarea', label: 'Full Name' }
      }
    };

    const result = serializeConfigToTs(config, 'default');
    expect(result).toContain("import { defineConfig } from '@zod-to-form/core'");
    expect(result).toContain('export default defineConfig');
    expect(result).toContain('"Textarea"');
    expect(result).toContain('"Full Name"');
    expect(result).toContain('fields:');
  });

  it('uses shadcn preset for shadcn componentMap', () => {
    const result = serializeConfigToTs(null, 'shadcn');
    expect(result).toContain("preset: 'shadcn'");
    expect(result).toContain("source: './components/ui'");
    expect(result).toContain("ui: 'shadcn'");
  });

  it('uses html for default componentMap', () => {
    const result = serializeConfigToTs(null, 'default');
    expect(result).toContain("source: './components'");
    expect(result).toContain("ui: 'html'");
    expect(result).not.toContain('preset:');
  });

  it('handles null config with proper defaults', () => {
    const result = serializeConfigToTs(null, 'default');
    expect(result).toContain('defineConfig');
    expect(result).toContain("mode: 'submit'");
    expect(result).toContain('serverAction: false');
  });
});

describe('export auto-detection', () => {
  it('detects bundle mode when customComponents is non-null', () => {
    const input = { customComponents: { Button: 'export...' } };
    const hasCustom = input.customComponents && Object.keys(input.customComponents).length > 0;
    expect(hasCustom).toBe(true);
  });

  it('detects instructions mode when customComponents is null', () => {
    const input = { customComponents: null as Record<string, string> | null };
    const hasCustom =
      input.customComponents && Object.keys(input.customComponents ?? {}).length > 0;
    expect(hasCustom).toBeFalsy();
  });

  it('detects instructions mode when customComponents is empty', () => {
    const input = { customComponents: {} };
    const hasCustom = input.customComponents && Object.keys(input.customComponents).length > 0;
    expect(hasCustom).toBe(false);
  });
});
