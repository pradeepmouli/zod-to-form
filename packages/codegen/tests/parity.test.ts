/**
 * Parity harness — Task 7 of feat/codegen-runtime-parity
 *
 * Asserts that codegen's `renderMappedComponent` faithfully materializes the
 * output of the three shared leaf resolvers from @zod-to-form/core:
 *   - resolveBaseProps(field)   → { id, required?, readOnly?, disabled? }
 *   - resolveNativeAttrs(field) → { type? }
 *   - resolveOptionsProps(field) → { options? }
 *
 * If this test fails, codegen and the shared resolvers have drifted apart.
 * Do NOT weaken this test to force green — investigate and fix the source.
 *
 * Runtime parity note: the runtime renderer (packages/react) composes the same
 * resolvers via `buildBaseComponentProps` (PT5). This test gates the codegen side;
 * the runtime side is covered by its own renderer tests that import the same exports.
 */

import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import {
  walkSchema,
  resolveBaseProps,
  resolveNativeAttrs,
  resolveOptionsProps
} from '@zod-to-form/core';
import { generateFormComponent } from '../src/index.ts';
import type { FormField } from '@zod-to-form/core';

// ─── Schema exercising Stage-1 leaf types ────────────────────────────────────

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).optional(),
  agree: z.boolean()
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Unique mapped component name per field key.
 * These are non-builtin names, so `resolveFieldMapping` returns source:'components'
 * and `renderMappedComponent` is invoked (the MAPPED leaf path).
 */
const FIELD_COMPONENT_MAP: Record<string, string> = {
  name: 'NameInput',
  email: 'EmailInput',
  age: 'AgeInput',
  agree: 'AgreeCheckbox'
};

/**
 * Build a componentConfig that routes every leaf through renderMappedComponent
 * by mapping each field key to a unique custom (non-builtin) component name.
 */
function buildComponentConfig() {
  return {
    components: {
      source: './components',
      overrides: {} as Record<string, unknown>
    },
    fields: Object.fromEntries(
      Object.entries(FIELD_COMPONENT_MAP).map(([key, component]) => [key, { component }])
    )
  };
}

/**
 * Parse a single JSX element's attribute string from the generated source.
 *
 * Finds the first occurrence of `<ComponentName` and extracts the attributes
 * up to (but not including) the closing ` />`.
 */
function extractAttrString(source: string, componentName: string): string {
  const open = `<${componentName}`;
  const start = source.indexOf(open);
  if (start === -1) {
    throw new Error(`Component <${componentName}> not found in generated source`);
  }
  const attrStart = start + open.length;
  // Find the self-closing `/>` or the end of the tag
  const tagEnd = source.indexOf('/>', attrStart);
  if (tagEnd === -1) {
    throw new Error(`No self-closing /> found after <${componentName}>`);
  }
  return source.slice(attrStart, tagEnd);
}

/**
 * Assert that every key/value in `expected` appears in `attrString`.
 *
 * - Boolean `true` → JSX shorthand: attribute name appears as a standalone word
 *   (e.g. ` required ` or ` required{` or ` required\n`)
 * - String values → `key="value"` appears in the attributes
 * - Other scalar values → `key={value}` (e.g. numbers)
 *
 * Skips `id` since its presence is always asserted separately via `id="fieldKey"`.
 */
function assertPropsPresent(
  attrString: string,
  expected: Record<string, unknown>,
  fieldKey: string
): void {
  for (const [key, value] of Object.entries(expected)) {
    if (key === 'id') {
      // id is always emitted; verified via id="fieldKey" check below
      const expectedId = `id="${fieldKey}"`;
      expect(attrString, `field "${fieldKey}": id attr`).toContain(expectedId);
      continue;
    }

    if (value === true) {
      // Boolean true → shorthand JSX attr: `key` must appear as a word boundary
      // Match ` key` followed by space, `{`, `=`, or `/`
      const pattern = new RegExp(`\\b${key}(?=[\\s{=/]|$)`);
      expect(
        pattern.test(attrString),
        `field "${fieldKey}": expected boolean shorthand attr "${key}" in: ${attrString}`
      ).toBe(true);
    } else if (typeof value === 'string') {
      const expectedAttr = `${key}="${value}"`;
      expect(attrString, `field "${fieldKey}": expected string attr ${expectedAttr}`).toContain(
        expectedAttr
      );
    } else if (typeof value === 'number') {
      // Numbers are emitted as {value}
      const expectedAttr = `${key}={${value}}`;
      expect(attrString, `field "${fieldKey}": expected numeric attr ${expectedAttr}`).toContain(
        expectedAttr
      );
    }
    // Objects/arrays are silently skipped by renderResolverProps — no assertion needed
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('parity harness: codegen materializes shared leaf resolvers', () => {
  // Walk the root z.object() — the walker iterates the shape directly and returns
  // the leaf fields flat (no wrapping Fieldset at the top level for root objects).
  const leafFields: FormField[] = walkSchema(schema);

  if (leafFields.length === 0) {
    throw new Error('walkSchema returned no fields');
  }

  const componentConfig = buildComponentConfig();

  // Generate a component that maps all four leaves through renderMappedComponent
  const source = generateFormComponent(leafFields, {
    exportName: 'schema',
    componentName: 'ParityForm',
    mode: 'submit',
    ui: 'html',
    componentConfig
  });

  it('generates a component with all four mapped leaf components', () => {
    for (const componentName of Object.values(FIELD_COMPONENT_MAP)) {
      expect(source, `Expected <${componentName}> in generated source`).toContain(
        `<${componentName}`
      );
    }
  });

  it('imports all mapped component names from the configured source', () => {
    for (const componentName of Object.values(FIELD_COMPONENT_MAP)) {
      expect(source, `Expected ${componentName} in import`).toContain(componentName);
    }
    expect(source).toContain("from './components'");
  });

  for (const field of leafFields) {
    const componentName = FIELD_COMPONENT_MAP[field.key];
    if (!componentName) continue;

    // Compute the expected props from the shared resolvers (same as runtime)
    const expected: Record<string, unknown> = {
      ...resolveBaseProps(field),
      ...resolveNativeAttrs(field),
      ...resolveOptionsProps(field)
    };

    it(`field "${field.key}": emits all shared resolver props via renderMappedComponent`, () => {
      const attrString = extractAttrString(source, componentName);

      assertPropsPresent(attrString, expected, field.key);
    });

    it(`field "${field.key}": resolver composition matches expected shape`, () => {
      // Document exactly what the resolvers produce for each field
      // so a future resolver change makes this test fail with a clear diff
      const baseProps = resolveBaseProps(field);
      const nativeAttrs = resolveNativeAttrs(field);
      const optionsProps = resolveOptionsProps(field);

      expect(baseProps['id']).toBe(field.key);
      if (field.required) {
        expect(baseProps['required']).toBe(true);
      } else {
        expect(baseProps['required']).toBeUndefined();
      }

      // nativeAttrs extracts all allowlisted DOM attrs (type, minLength, maxLength,
      // pattern, min, max, step); verify 'type' is correctly mirrored from props
      if (field.props['type'] !== undefined) {
        expect(nativeAttrs['type']).toBe(field.props['type']);
      } else {
        expect(nativeAttrs['type']).toBeUndefined();
      }

      // optionsProps is empty for plain leaf fields (no enum/union)
      expect(optionsProps['options']).toBeUndefined();

      // The composed expected record must equal the union of all three resolvers
      expect(expected).toStrictEqual({ ...baseProps, ...nativeAttrs, ...optionsProps });
    });
  }

  // ── Per-field spot-checks (explicit expected values) ──────────────────────

  it('name field: id="name", required shorthand, type="text"', () => {
    const nameField = leafFields.find((f) => f.key === 'name');
    expect(nameField, 'name field must exist').toBeDefined();
    const attrString = extractAttrString(source, 'NameInput');
    expect(attrString).toContain('id="name"');
    expect(attrString).toContain('type="text"');
    // required as boolean shorthand (not required={true})
    expect(attrString).toMatch(/\brequired(?=[\s{=/]|$)/);
    expect(attrString).not.toContain('required={true}');
  });

  it('email field: id="email", required shorthand, type="email"', () => {
    const emailField = leafFields.find((f) => f.key === 'email');
    expect(emailField, 'email field must exist').toBeDefined();
    const attrString = extractAttrString(source, 'EmailInput');
    expect(attrString).toContain('id="email"');
    expect(attrString).toContain('type="email"');
    expect(attrString).toMatch(/\brequired(?=[\s{=/]|$)/);
    expect(attrString).not.toContain('required={true}');
  });

  it('age field: id="age", type="number", NO required (optional)', () => {
    const ageField = leafFields.find((f) => f.key === 'age');
    expect(ageField, 'age field must exist').toBeDefined();
    const attrString = extractAttrString(source, 'AgeInput');
    expect(attrString).toContain('id="age"');
    expect(attrString).toContain('type="number"');
    // age is optional — required must NOT appear as a standalone attr
    expect(attrString).not.toMatch(/\brequired(?=[\s{=/]|$)/);
  });

  it('agree field: id="agree", required shorthand, NO type (boolean has no native type)', () => {
    const agreeField = leafFields.find((f) => f.key === 'agree');
    expect(agreeField, 'agree field must exist').toBeDefined();
    const attrString = extractAttrString(source, 'AgreeCheckbox');
    expect(attrString).toContain('id="agree"');
    expect(attrString).toMatch(/\brequired(?=[\s{=/]|$)/);
    // boolean fields have no props.type → resolveNativeAttrs returns {}
    // so no type= attr should appear before the register spread
    // (the spread {...register(...)} may add type="checkbox" at runtime, but not statically)
    expect(attrString.split('{...')[0]).not.toContain('type=');
  });

  // ── Hardcoded non-tautological parity assertions ──────────────────────────
  // These do NOT derive their expected values from the resolvers — they are
  // explicit literal assertions. Reverting the NATIVE_INPUT_ATTRS allowlist to
  // ['type'] only would cause these tests to fail because minLength/min would
  // no longer appear in the generated source.

  it('name field: emits minLength={2} (hardcoded — z.string().min(2) → minLength attr in codegen)', () => {
    const attrString = extractAttrString(source, 'NameInput');
    // z.string().min(2) sets field.props.minLength = 2
    // resolveNativeAttrs must include 'minLength' in its allowlist for this to appear.
    // If NATIVE_INPUT_ATTRS reverts to ['type'] only, this assertion WILL FAIL.
    expect(attrString).toContain('minLength={2}');
  });

  it('age field: emits min={18} (hardcoded — z.number().min(18) → min attr in codegen)', () => {
    const attrString = extractAttrString(source, 'AgeInput');
    // z.number().min(18) sets field.props.min = 18
    // resolveNativeAttrs must include 'min' in its allowlist for this to appear.
    // If NATIVE_INPUT_ATTRS reverts to ['type'] only, this assertion WILL FAIL.
    expect(attrString).toContain('min={18}');
  });
});

// ─── Focused parity cases: controlled boolean + string-date routing ───────────
//
// These tests are completely independent of the main schema above.
// Each builds its own schema, walks it, and generates output — so a failure
// pinpoints exactly which codegen path regressed, with no ambiguity.

describe('parity harness: controlled boolean coercion (!!field.value allowlist)', () => {
  // Walk a z.boolean() field and route it through a Checkbox component with
  // controlled:true and the shadcn Checkbox prop shape.
  const boolSchema = z.object({ agree: z.boolean() });
  const boolFields = walkSchema(boolSchema);

  const boolSource = generateFormComponent(boolFields, {
    exportName: 'boolSchema',
    componentName: 'BoolForm',
    mode: 'submit',
    ui: 'html',
    componentConfig: {
      components: {
        source: './components',
        overrides: {
          Checkbox: {
            controlled: true,
            props: {
              checked: '!!field.value',
              onCheckedChange: 'field.onChange'
            }
          }
        }
      },
      fields: {
        agree: { component: 'Checkbox' }
      }
    }
  });

  it('emits checked={!!field.value} (hardcoded — !!field.value must be in the RHF_FIELD_EXPRESSIONS allowlist)', () => {
    // If Task 1 (core !!field.value allowlist) is reverted, RHF_FIELD_EXPRESSIONS will no
    // longer contain '!!field.value'. renderControlledComponent will fall back to the
    // default value={field.value} prop instead of mapping checked={!!field.value}, and
    // this literal assertion WILL FAIL.
    expect(boolSource).toContain('checked={!!field.value}');
  });

  it('emits onCheckedChange={field.onChange} (hardcoded — shadcn Checkbox event prop)', () => {
    // The onCheckedChange→field.onChange mapping is only emitted when:
    //   (a) '!!field.value' is in RHF_FIELD_EXPRESSIONS (so the controlled path fires), AND
    //   (b) resolvePropMap correctly threads the componentOverride.props through to
    //       renderControlledComponent which remaps onChange → onCheckedChange.
    // Reverting either would break this assertion.
    expect(boolSource).toContain('onCheckedChange={field.onChange}');
  });

  it('does NOT emit value === true (hardcoded — boolean coercion must NOT use strict equality)', () => {
    // The old (wrong) pattern was `value={field.value === true}`.
    // !!field.value is the correct coercion. This gate ensures the broken pattern cannot
    // silently reappear in the generated output.
    expect(boolSource).not.toContain('=== true');
  });

  it('uses Controller (not register spread) because controlled:true is set', () => {
    // Controlled components MUST use <Controller> so RHF can pass field.value/onChange.
    // A bare register spread would break the checked binding entirely.
    expect(boolSource).toContain('<Controller');
    expect(boolSource).not.toMatch(/\{\.\.\.(register\()/);
  });
});

describe('parity harness: string-date routing to native <input type="date"> via register', () => {
  // Walk a z.string().date() field — the string processor maps it to:
  //   component: 'Input', props.type: 'date', zodType: 'string'
  // Critically, zodType stays 'string', so NO date coercion (setValueAs) is applied,
  // and the field renders via register (uncontrolled), NOT via <Controller>.
  const dateSchema = z.object({ startDate: z.string().date() });
  const dateFields = walkSchema(dateSchema);

  const dateSource = generateFormComponent(dateFields, {
    exportName: 'dateSchema',
    componentName: 'DateForm',
    mode: 'submit',
    ui: 'html',
    componentConfig: {
      components: {
        source: './components',
        overrides: {}
      },
      fields: {
        startDate: { component: 'DateField' }
      }
    }
  });

  it('emits type="date" as a static attribute (hardcoded — string-date → native input)', () => {
    // Task 2 routes z.string().date() → props.type='date' → resolveNativeAttrs emits type="date".
    // If date-routing is reverted, the type prop would fall back to 'text' and this WILL FAIL.
    expect(dateSource).toContain('type="date"');
  });

  it('binds via register spread, NOT a <Controller> wrapper (hardcoded — string keeps string value)', () => {
    // z.string().date() stays on zodType:'string' — no date coercion is needed.
    // The correct render is: <DateField ... {...register('startDate')} />
    // NOT: <Controller name="startDate" ... render={({ field }) => ...} />
    // If the routing regresses to treating z.string().date() like z.date(), a Controller
    // would be emitted and this assertion WILL FAIL.
    expect(dateSource).toContain('{...register(');
    expect(dateSource).not.toContain('<Controller');
  });

  it('does NOT emit setValueAs date coercion (hardcoded — string value, no Date object needed)', () => {
    // z.string().date() keeps a string value — Zod parses it directly.
    // The date coercion lambda (new Date(v)) is only for z.date() (DatePicker component).
    // Emitting it for z.string().date() would be wrong and break optional fields (empty→Date).
    expect(dateSource).not.toContain('new Date(');
  });
});
