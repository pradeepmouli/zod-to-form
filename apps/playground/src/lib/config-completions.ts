import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { FormField } from '@zod-to-form/core';
import { FIELD_COMPONENT_NAMES } from '@zod-to-form/react';

/**
 * CodeMirror completion source for z2f.config.ts editing.
 *
 * Provides context-aware suggestions based on cursor position within
 * the defineConfig({ ... }) structure. Component names are derived
 * from the actual component map, not hardcoded.
 */
export function configCompletionSource(
  fields: FormField[] | null,
  customComponentNames: string[]
): (ctx: CompletionContext) => CompletionResult | null {
  return (ctx: CompletionContext): CompletionResult | null => {
    // Only complete after word characters or at the start of a key/value
    const word = ctx.matchBefore(/[\w'"]*/);
    if (!word) return null;
    // Don't trigger on empty match unless explicitly requested
    if (word.from === word.to && !ctx.explicit) return null;

    const doc = ctx.state.doc.toString();
    const pos = ctx.pos;
    const before = doc.slice(0, pos);

    // Detect context from surrounding text
    const context = detectContext(before);

    switch (context) {
      case 'top-level':
        return complete(word.from, [
          { label: 'components', type: 'property', detail: '{ source, preset, overrides }' },
          { label: 'defaults', type: 'property', detail: '{ mode, ui, ... }' },
          { label: 'fields', type: 'property', detail: 'Per-field overrides' },
          { label: 'include', type: 'property', detail: 'string[]' },
          { label: 'exclude', type: 'property', detail: 'string[]' }
        ]);

      case 'components':
        return complete(word.from, [
          { label: 'source', type: 'property', detail: 'Component import path' },
          { label: 'preset', type: 'property', detail: "'shadcn' | 'html'" },
          { label: 'overrides', type: 'property', detail: 'Per-component overrides' },
          { label: 'fieldTemplate', type: 'property', detail: 'Field wrapper template' }
        ]);

      case 'components.preset':
        return complete(word.from, [
          { label: "'shadcn'", type: 'enum' },
          { label: "'html'", type: 'enum' }
        ]);

      case 'defaults':
        return complete(word.from, [
          { label: 'mode', type: 'property', detail: "'submit' | 'auto-save'" },
          { label: 'ui', type: 'property', detail: "'shadcn' | 'html'" },
          { label: 'overwrite', type: 'property', detail: 'boolean' },
          { label: 'serverAction', type: 'property', detail: 'boolean' },
          { label: 'formProvider', type: 'property', detail: 'boolean' }
        ]);

      case 'defaults.mode':
        return complete(word.from, [
          { label: "'submit'", type: 'enum' },
          { label: "'auto-save'", type: 'enum' }
        ]);

      case 'defaults.ui':
        return complete(word.from, [
          { label: "'shadcn'", type: 'enum' },
          { label: "'html'", type: 'enum' }
        ]);

      case 'fields':
        return complete(word.from, fieldKeyCompletions(fields));

      case 'field-config':
        return complete(word.from, [
          { label: 'component', type: 'property', detail: 'Component name' },
          { label: 'label', type: 'property', detail: 'string' },
          { label: 'placeholder', type: 'property', detail: 'string' },
          { label: 'order', type: 'property', detail: 'number' },
          { label: 'hidden', type: 'property', detail: 'boolean' },
          { label: 'disabled', type: 'property', detail: 'boolean' },
          { label: 'helpText', type: 'property', detail: 'string' },
          { label: 'props', type: 'property', detail: 'Extra props' }
        ]);

      case 'field-config.component':
        return complete(word.from, componentNameCompletions(customComponentNames));

      case 'overrides':
        return complete(word.from, componentNameCompletions(customComponentNames));

      case 'override-config':
        return complete(word.from, [
          { label: 'controlled', type: 'property', detail: 'boolean' },
          { label: 'props', type: 'property', detail: 'Record<string, string>' }
        ]);

      default:
        return null;
    }
  };
}

type ConfigContext =
  | 'top-level'
  | 'components'
  | 'components.preset'
  | 'defaults'
  | 'defaults.mode'
  | 'defaults.ui'
  | 'fields'
  | 'field-config'
  | 'field-config.component'
  | 'overrides'
  | 'override-config'
  | null;

/** @internal Exported for testing */
export function detectContext(before: string): ConfigContext {
  // Find the deepest open block by tracking braces
  const blocks: string[] = [];
  let lastKey = '';

  // Simple brace-tracking parser
  for (let i = 0; i < before.length; i++) {
    const ch = before[i];
    if (ch === '{') {
      blocks.push(lastKey);
      lastKey = '';
    } else if (ch === '}') {
      blocks.pop();
      lastKey = '';
    } else if (ch === ':') {
      // Look back for the key name
      const keyMatch = before.slice(0, i).match(/(\w+)\s*$/);
      if (keyMatch) lastKey = keyMatch[1];
    } else if (ch === ',') {
      lastKey = '';
    }
  }

  // blocks[0] is the defineConfig root, blocks[1+] are nested
  const depth = blocks.length;
  if (depth === 0) return null;

  // Check if we're in a value position (after a colon)
  const afterColon = /:\s*['"]?\s*$/.test(before);
  const currentBlock = blocks[depth - 1];

  if (depth === 1) {
    // Inside defineConfig({ ... })
    return 'top-level';
  }

  if (depth === 2) {
    if (currentBlock === 'components') {
      if (afterColon && lastKey === 'preset') return 'components.preset';
      return 'components';
    }
    if (currentBlock === 'defaults') {
      if (afterColon && lastKey === 'mode') return 'defaults.mode';
      if (afterColon && lastKey === 'ui') return 'defaults.ui';
      return 'defaults';
    }
    if (currentBlock === 'fields') return 'fields';
    if (currentBlock === 'overrides') return 'overrides';
  }

  if (depth === 3) {
    const parentBlock = blocks[depth - 2];
    if (parentBlock === 'fields') {
      if (afterColon && lastKey === 'component') return 'field-config.component';
      return 'field-config';
    }
    // overrides is inside components: defineConfig > components > overrides
    if (currentBlock === 'overrides') return 'overrides';
  }

  if (depth === 4) {
    const grandparent = blocks[depth - 3];
    // override entries: defineConfig > components > overrides > ComponentName
    if (grandparent === 'components') return 'override-config';
  }

  return null;
}

type Completion = { label: string; type: string; detail?: string };

function complete(from: number, options: Completion[]): CompletionResult {
  return { from, options, validFor: /^[\w']*$/ };
}

function fieldKeyCompletions(fields: FormField[] | null): Completion[] {
  if (!fields) return [];
  return fields.map((f) => ({
    label: `'${f.key}'`,
    type: 'property',
    detail: `${f.component} — ${f.label}`
  }));
}

function componentNameCompletions(customComponentNames: string[]): Completion[] {
  const builtIn = FIELD_COMPONENT_NAMES.map((name) => ({
    label: `'${name}'`,
    type: 'enum',
    detail: 'Built-in'
  }));

  const custom = customComponentNames.map((name) => ({
    label: `'${name}'`,
    type: 'enum',
    detail: 'Custom'
  }));

  return [...builtIn, ...custom];
}
