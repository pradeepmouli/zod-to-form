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

  return base
    // Insert space before uppercase letters (camelCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, ' ')
    // Capitalize the first letter of each word
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
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
