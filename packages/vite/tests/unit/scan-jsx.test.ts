import { describe, expect, it } from 'vitest';
import { scanJsx } from '../../src/rewrite-mode/scan-jsx.js';

/**
 * Contract: scanJsx finds candidate <ZodForm> JSX elements with an
 * Identifier-typed schema prop, and reports skip diagnostics for sites
 * that match `<ZodForm>` but fail an early structural check.
 *
 * The substring fast-path returns null (not an empty result) when the
 * source doesn't contain `'ZodForm'` at all, so callers can short-circuit.
 */
describe('scanJsx', () => {
  it('returns null for sources that do not contain "ZodForm"', () => {
    expect(scanJsx('export const x = 1;')).toBeNull();
    expect(scanJsx('function App() { return <div>hi</div>; }')).toBeNull();
  });

  it('surfaces parse failure as a buffered skip diagnostic (not silent null)', () => {
    // The parse error itself still propagates through Vite's normal
    // pipeline — but we record one skip line so the buildEnd summary
    // shows the user that rewrite-mode tried and bailed.
    const result = scanJsx('const ZodForm = ; <ZodForm schema={x} />');
    expect(result).not.toBeNull();
    expect(result?.candidates).toHaveLength(0);
    expect(result?.skipped).toHaveLength(1);
    expect(result?.skipped[0]?.reason).toMatch(/babel parse failed/);
  });

  it('finds a single <ZodForm> with an Identifier schema prop', () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { signupSchema } from './signup';
export function App() {
  return <ZodForm schema={signupSchema} onSubmit={(d) => console.log(d)} />;
}
`;
    const result = scanJsx(source);
    expect(result).not.toBeNull();
    expect(result?.candidates).toHaveLength(1);
    expect(result?.candidates[0]?.schemaIdentifier).toBe('signupSchema');
    expect(result?.candidates[0]?.selfClosing).toBe(true);
    // The schema attribute must appear in the attribute list (so rewrite-source can remove it)
    const attrs = result?.candidates[0]?.attributes ?? [];
    expect(attrs.some((a) => a.kind === 'named' && a.name === 'schema')).toBe(true);
    expect(attrs.some((a) => a.kind === 'named' && a.name === 'onSubmit')).toBe(true);
  });

  it('finds multiple <ZodForm> elements in one file', () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { a, b } from './schemas';
const App = () => (<>
  <ZodForm schema={a} />
  <ZodForm schema={b} />
</>);
`;
    const result = scanJsx(source);
    expect(result?.candidates).toHaveLength(2);
    expect(result?.candidates.map((c) => c.schemaIdentifier)).toEqual(['a', 'b']);
  });

  it('preserves children for non-self-closing elements', () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s}><h1>Title</h1></ZodForm>;
`;
    const result = scanJsx(source);
    expect(result?.candidates).toHaveLength(1);
    const c = result?.candidates[0]!;
    expect(c.selfClosing).toBe(false);
    expect(c.closingRange).not.toBeNull();
    expect(c.childrenSource).toContain('<h1>Title</h1>');
  });

  it('skips <ZodForm> with no schema prop and reports a diagnostic', () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
const App = () => <ZodForm onSubmit={() => {}} />;
`;
    const result = scanJsx(source);
    expect(result?.candidates).toHaveLength(0);
    expect(result?.skipped).toHaveLength(1);
    expect(result?.skipped[0]?.reason).toMatch(/schema/);
  });

  it('skips <ZodForm schema={inlined()}> and reports the expression type', () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { z } from 'zod';
const App = () => <ZodForm schema={z.object({ a: z.string() })} />;
`;
    const result = scanJsx(source);
    expect(result?.candidates).toHaveLength(0);
    expect(result?.skipped).toHaveLength(1);
    // The expression type is CallExpression (z.object(...))
    expect(result?.skipped[0]?.reason).toMatch(/CallExpression|expression/);
  });

  it('skips <ZodForm schema={a ? b : c}> (conditional)', () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { a, b } from './s';
const App = ({ flag }) => <ZodForm schema={flag ? a : b} />;
`;
    const result = scanJsx(source);
    expect(result?.candidates).toHaveLength(0);
    expect(result?.skipped).toHaveLength(1);
    expect(result?.skipped[0]?.reason).toMatch(/Conditional|expression/);
  });

  it('skips <z2f.ZodForm> (member-expression element name)', () => {
    const source = `
import * as z2f from '@zod-to-form/react';
import { s } from './s';
const App = () => <z2f.ZodForm schema={s} />;
`;
    const result = scanJsx(source);
    expect(result?.candidates).toHaveLength(0);
    expect(result?.skipped).toHaveLength(1);
    expect(result?.skipped[0]?.reason).toMatch(/member-expression/);
  });

  it('preserves spread attributes in the attribute list', () => {
    const source = `
import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = (props) => <ZodForm schema={s} {...props} onSubmit={f} />;
`;
    const result = scanJsx(source);
    expect(result?.candidates).toHaveLength(1);
    const attrs = result?.candidates[0]?.attributes ?? [];
    expect(attrs.some((a) => a.kind === 'spread')).toBe(true);
    expect(attrs.filter((a) => a.kind === 'named' && a.name === 'onSubmit')).toHaveLength(1);
  });

  it('records source byte ranges for the opening and closing tags', () => {
    const source = `import { ZodForm } from '@zod-to-form/react';
import { s } from './s';
const App = () => <ZodForm schema={s}>child</ZodForm>;
`;
    const result = scanJsx(source);
    const c = result?.candidates[0]!;
    expect(c.openingRange.start).toBeGreaterThan(0);
    expect(c.openingRange.end).toBeGreaterThan(c.openingRange.start);
    // The opening slice should contain "ZodForm" and "schema"
    const openingSlice = source.slice(c.openingRange.start, c.openingRange.end);
    expect(openingSlice).toContain('ZodForm');
    expect(openingSlice).toContain('schema');
    // Closing range should contain "</ZodForm>"
    expect(c.closingRange).not.toBeNull();
    const closingSlice = source.slice(c.closingRange!.start, c.closingRange!.end);
    expect(closingSlice).toContain('ZodForm');
  });
});
