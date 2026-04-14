/**
 * Disk-write collision guard.
 *
 * When the user opts into `PluginOptions.write`, the plugin writes
 * generated form files to disk. FR-007 forbids clobbering pre-existing
 * `*.generated.tsx` files that the user committed (e.g. CLI output from
 * a prior workflow). This guard is the pure check that gates every
 * disk write.
 *
 * Closes finding M1 from /speckit.analyze.
 */
import { Z2FViteError } from './errors.js';

export interface WriteCollisionInput {
  /** Absolute path the plugin wants to write to. */
  targetPath: string;
  /**
   * Current contents of the file at `targetPath`, or `null` if the file
   * does not exist. The caller is responsible for the actual `readFile`
   * — we deliberately keep this function pure.
   */
  existingContents: string | null;
  /**
   * Set of absolute paths the plugin has already emitted during the
   * current build/dev session. If the target path is in this set, we're
   * updating our own output (subsequent compile of the same target after
   * a cache miss/eviction) and overwriting is safe.
   */
  emittedThisRun: Set<string>;
}

/**
 * Decide whether writing to `targetPath` is safe.
 *
 * Returns the literal string `'write'` when safe — chosen over a boolean
 * so the call site reads naturally (`if (checkWriteCollision(...) ===
 * 'write') { ... }`). Throws otherwise.
 */
export function checkWriteCollision(input: WriteCollisionInput): 'write' {
  const { targetPath, existingContents, emittedThisRun } = input;

  // No file → safe
  if (existingContents === null) return 'write';

  // File belongs to a target this plugin run already emitted → safe
  // (we're overwriting our own output, e.g. after a cache eviction)
  if (emittedThisRun.has(targetPath)) return 'write';

  // File exists, was NOT produced by us → refuse
  throw new Z2FViteError(
    'Z2F_VITE_WOULD_CLOBBER_FILE',
    `Refusing to overwrite existing file '${targetPath}'. The file was not produced by this plugin run, so it is most likely a committed file (e.g. CLI output from a prior codegen run). To proceed: delete the file manually, change 'write.outDir' to point somewhere else, or disable disk writes by removing the 'write' option.`,
    { file: targetPath }
  );
}
