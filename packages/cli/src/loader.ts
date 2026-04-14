/**
 * CLI schema/config loader — thin re-export layer over `@zod-to-form/core/loader`.
 *
 * Kept as a separate file for backward compatibility: existing CLI tests
 * and modules import `loadSchema` etc. from `./loader.js`. The implementation
 * lives in core so the Vite plugin and any other Node-side consumer share
 * exactly the same evaluation pipeline (parity gate FR-019).
 */
export {
  loadSchema,
  loadSchemaModule,
  resolveSchemaExportNames,
  loadConfig,
  loadDefaultConfig,
  resolveDefaultConfigPath
} from '@zod-to-form/core/loader';
