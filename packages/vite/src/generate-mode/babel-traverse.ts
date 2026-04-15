/**
 * `@babel/traverse` ESM/CJS interop shim.
 *
 * The package's published types model the entry point as a namespace,
 * but at runtime it's either the function itself (modern bundlers) or
 * a `{ default: fn }` object (CJS interop). Importing as a namespace
 * and then unwrapping at runtime is the only shape that works under
 * tsgo, vitest, AND esbuild's bundler at the same time.
 *
 * This file owns the cast so neither `scan-jsx.ts` nor `resolve-schema.ts`
 * has to repeat the same five-line dance.
 */
import * as traverseModule from '@babel/traverse';
import type { TraverseOptions } from '@babel/traverse';

type TraverseFn = <S = unknown>(ast: unknown, opts: TraverseOptions<S>) => void;

const traverseAny = traverseModule as unknown as TraverseFn | { default: TraverseFn };

export const traverse: TraverseFn =
  typeof traverseAny === 'function' ? traverseAny : traverseAny.default;
