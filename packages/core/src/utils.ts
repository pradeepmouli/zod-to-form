import type { FormField } from './types.js';

/**
 * Convert a camelCase or snake_case key to a human-readable Title Case label.
 *
 * @example inferLabel('firstName') → 'First Name'
 * @example inferLabel('email_address') → 'Email Address'
 */
export function inferLabel(key: string): string {
  // Remove everything before the last dot (for nested paths like "address.street")
  const base = key.includes('.') ? key.split('.').pop()! : key;

  return (
    base
      // Insert space before uppercase letters (camelCase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Capitalize the first letter of each word
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim()
  );
}

/**
 * Join a parent key path with a child key.
 *
 * @example joinPath(undefined, 'name') → 'name'
 * @example joinPath('address', 'street') → 'address.street'
 */
export function joinPath(parent: string | undefined, key: string): string {
  if (!parent) return key;
  return `${parent}.${key}`;
}

/**
 * Translate a simple structural regex pattern into an input mask string.
 *
 * Supported tokens:
 * - `\d{N}` or `\d` → N digit placeholders (`9`)
 * - `[0-9]{N}` → N digit placeholders (`9`)
 * - `[A-Z]{N}`, `[a-z]{N}`, `[A-Za-z]{N}` → N letter placeholders (`a`)
 * - `[A-Za-z0-9]{N}` → N alphanumeric placeholders (`*`)
 * - Literal separator chars (`- / ( ) . : _ + space`)
 * - `^` / `$` anchors (stripped)
 *
 * Returns `null` for patterns that cannot be expressed as a fixed mask
 * (variable length, alternation, lookaheads, capturing groups, etc.).
 *
 * The output format is compatible with `imask`, `react-input-mask`, and
 * similar libraries where `9`=digit, `a`=letter, `*`=alphanumeric.
 *
 * @example regexToMask('^\\d{3}-\\d{2}-\\d{4}$') → '999-99-9999'
 * @example regexToMask('^[A-Z]{2}\\d{5}$') → 'aa99999'
 * @example regexToMask('^\\d{2}/\\d{2}/\\d{4}$') → '99/99/9999'
 * @example regexToMask('^[a-zA-Z0-9._%+-]+@') → null  (too complex)
 */
export function regexToMask(pattern: string): string | null {
  // Strip anchors
  const p = pattern.replace(/^\^/, '').replace(/\$$/, '');
  let result = '';
  let i = 0;

  while (i < p.length) {
    // \d (optionally followed by {N})
    if (p[i] === '\\' && p[i + 1] === 'd') {
      i += 2;
      const q = parseQuantifier(p, i);
      if (q === null) {
        result += '9';
      } else {
        result += '9'.repeat(q.value);
        i += q.consumed;
      }
      continue;
    }

    // Character class [...]
    if (p[i] === '[') {
      const end = p.indexOf(']', i + 1);
      if (end === -1) return null;
      const cls = p.slice(i + 1, end);
      i = end + 1;
      const q = parseQuantifier(p, i);
      const n = q ? q.value : 1;
      if (q) i += q.consumed;
      const ch = charClassToMaskChar(cls);
      if (ch === null) return null;
      result += ch.repeat(n);
      continue;
    }

    // \\( and \\) — escaped literal parens, and other escaped separator chars (e.g. \/)
    if (p[i] === '\\' && i + 1 < p.length) {
      const next = p[i + 1]!;
      if (next === '(' || next === ')') {
        result += next;
        i += 2;
        continue;
      }
      // Escaped separator (\/ \- \. etc.) — treat as the literal char
      if (/[-/() .:_]/.test(next)) {
        result += next;
        i += 2;
        continue;
      }
    }

    // Literal separator characters (not quantifiers)
    const ch = p[i]!;
    if (/[-/() .:_]/.test(ch)) {
      result += ch;
      i++;
      continue;
    }

    // Anything else (quantifiers without a preceding token, special chars, etc.) — bail out
    return null;
  }

  return result.length > 0 ? result : null;
}

function parseQuantifier(p: string, i: number): { value: number; consumed: number } | null {
  if (p[i] !== '{') return null;
  const end = p.indexOf('}', i + 1);
  if (end === -1) return null;
  const inner = p.slice(i + 1, end);
  // Reject ranges like {2,4} — not fixed-length
  if (inner.includes(',')) return null;
  const n = parseInt(inner, 10);
  if (isNaN(n) || n < 1) return null;
  return { value: n, consumed: end - i + 1 };
}

function charClassToMaskChar(cls: string): string | null {
  if (cls === '0-9') return '9';
  if (cls === 'A-Z' || cls === 'a-z' || cls === 'A-Za-z' || cls === 'a-zA-Z') return 'a';
  if (cls === 'A-Za-z0-9' || cls === 'a-zA-Z0-9' || cls === '0-9A-Za-z' || cls === '0-9a-zA-Z')
    return '*';
  return null;
}

/**
 * Returns a type-safe empty default value for a FormField based on its zodType
 * and structure. Used by codegen for useFieldArray append() defaults and
 * by runtime for initial values.
 *
 * - string → ''
 * - number/bigint → 0
 * - boolean → false
 * - date → undefined
 * - object (Fieldset) → recursively builds from children
 * - array (ArrayField) → []
 * - enum → first option value or ''
 * - union/discriminatedUnion → first variant's empty default
 */
export function getEmptyDefault(field: FormField): unknown {
  // Explicit default takes priority
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  // Enums: use first option
  if (field.options && field.options.length > 0) {
    return field.options[0]!.value;
  }

  // Nested objects: recursively build
  if (field.component === 'Fieldset' && field.children) {
    const obj: Record<string, unknown> = {};
    for (const child of field.children) {
      const childKey = child.key.split('.').pop() ?? child.key;
      obj[childKey] = getEmptyDefault(child);
    }
    return obj;
  }

  // Arrays
  if (field.component === 'ArrayField') {
    return [];
  }

  // Primitives by zodType
  switch (field.zodType) {
    case 'number':
    case 'bigint':
      return 0;
    case 'boolean':
      return false;
    case 'date':
      return undefined;
    default:
      return '';
  }
}

/**
 * Create a base FormField with sensible defaults.
 * Processors fill in the specific component and props.
 */
export function createBaseField(key: string, zodType: string): FormField {
  return {
    key,
    component: 'Input',
    props: {},
    label: inferLabel(key),
    required: true,
    readOnly: false,
    hidden: false,
    constraints: {},
    zodType
  };
}
