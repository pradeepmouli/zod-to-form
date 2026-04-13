// Re-export shared schemas. Uses relative path to core's test fixtures.
// At runtime this resolves via pnpm workspace symlinks.
// For type-checking, the codegen tsconfig references the core project.
export {
  smallSchema,
  mediumSchema,
  largeSchema,
  smallValidData,
  mediumValidData,
  largeValidData
} from '../../../core/tests/performance/schemas.js';
