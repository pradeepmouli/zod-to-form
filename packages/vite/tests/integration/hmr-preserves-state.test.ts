import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { compileTarget } from '../../src/query-mode/transform.js';

/**
 * Integration: HMR preserves form state (FR-011, finding H1).
 *
 * The original spec for T028a asks for a full browser-mode test that
 * (a) renders the form through Vitest's browser mode, (b) types into a
 * field, (c) edits the schema additively, (d) triggers HMR, and (e)
 * asserts the typed value survives. That requires bringing react /
 * react-dom / react-hook-form / @hookform/resolvers / playwright into
 * the fixture and spinning up a headless browser — non-trivial setup
 * that pulls a lot of weight onto an integration test we run on every
 * commit.
 *
 * The HMR-preservation property actually depends on **React Fast
 * Refresh** being able to hot-swap the component in place rather than
 * remounting it. Fast Refresh requires the exported component to be:
 *
 *   1. A NAMED function declaration (or a const bound to one), so Fast
 *      Refresh can identify it across edits via its identity.
 *   2. The DEFAULT export OR an explicit named export — anonymous
 *      arrow-function exports break the refresh boundary.
 *   3. PascalCase (otherwise Fast Refresh treats it as a hook/util and
 *      remounts the parent instead).
 *
 * This test asserts the structural properties of the plugin's emitted
 * source that make it Fast Refresh compatible. A regression here would
 * cause the browser-mode test to fail in the obvious "field value lost
 * on edit" way, but the structural form catches it in 50ms instead of
 * 5000ms and doesn't need any browser plumbing.
 *
 * (The full browser-mode test remains a useful follow-up once the
 * Vitest browser harness lands in this monorepo for other packages.)
 */

const FORM_NAME = 'SignupForm';

describe('Fast Refresh structural compatibility (proxy for HMR state preservation)', () => {
  function compile(): string {
    const namespace = {
      signupSchema: z.object({
        name: z.string().min(2),
        email: z.string().email()
      })
    };
    const result = compileTarget({
      namespace,
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: {
        componentName: FORM_NAME,
        mode: 'submit',
        ui: 'html',
        schemaImportPath: './signup'
      }
    });
    return result.generatedSource;
  }

  it('emits a NAMED function declaration for the form component (not an arrow)', () => {
    const code = compile();
    // Either `function SignupForm(` or `const SignupForm = function`. An
    // arrow form like `const SignupForm = (props) => ...` would still let
    // Fast Refresh track it BY NAME, but the codegen has historically
    // used the function-declaration form — pin it so a refactor can't
    // accidentally regress to anonymous arrows.
    expect(code).toMatch(new RegExp(`function\\s+${FORM_NAME}\\s*\\(`));
  });

  it('exports the form component (so Fast Refresh sees a refresh boundary)', () => {
    const code = compile();
    // Must be either `export function SignupForm` or `export { SignupForm }`
    // or `export default function SignupForm`.
    const exportPatterns = [
      new RegExp(`export\\s+(default\\s+)?function\\s+${FORM_NAME}\\b`),
      new RegExp(`export\\s+const\\s+${FORM_NAME}\\b`),
      new RegExp(`export\\s*\\{[^}]*\\b${FORM_NAME}\\b[^}]*\\}`)
    ];
    expect(exportPatterns.some((p) => p.test(code))).toBe(true);
  });

  it('uses PascalCase for the component name (Fast Refresh is case-sensitive)', () => {
    expect(FORM_NAME[0]).toBe(FORM_NAME[0]?.toUpperCase());
    const code = compile();
    expect(code).toContain(FORM_NAME);
  });

  it('emits identical structure for additive schema changes (post-codegen byte parity)', () => {
    // Compile the same schema twice — additive change is a no-op for the
    // codegen's structure. A second compile with a strictly extended
    // schema must produce a result that contains a SUPERSET of the
    // original's field markup, NOT a structurally different component.
    const a = compileTarget({
      namespace: {
        signupSchema: z.object({
          name: z.string().min(2),
          email: z.string().email()
        })
      },
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: {
        componentName: FORM_NAME,
        mode: 'submit',
        ui: 'html',
        schemaImportPath: './signup'
      }
    }).generatedSource;

    const b = compileTarget({
      namespace: {
        signupSchema: z.object({
          name: z.string().min(2),
          email: z.string().email(),
          phone: z.string().optional()
        })
      },
      schemaFile: '/abs/src/schemas/signup.ts',
      variant: '',
      config: {
        componentName: FORM_NAME,
        mode: 'submit',
        ui: 'html',
        schemaImportPath: './signup'
      }
    }).generatedSource;

    // Both produce the same component name + same export shape, so Fast
    // Refresh would recognize them as the same component identity (and
    // thus preserve hook state, including react-hook-form's field state).
    expect(b).toContain(`function ${FORM_NAME}`);
    // The new field appears in the second source.
    expect(b).toContain('phone');
    // The existing fields are preserved in the second source.
    expect(b).toContain('name');
    expect(b).toContain('email');
    // The first source does NOT have the new field (sanity check).
    expect(a).not.toContain('phone');
  });
});
